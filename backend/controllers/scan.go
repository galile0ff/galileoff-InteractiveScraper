package controllers

import (
	"fmt"
	"net/http"
	"os"
	"scraper/models"
	"scraper/scraper"
	"scraper/utils"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ScanRequest struct {
	URL      string `json:"url" binding:"required"`
	RandomUA bool   `json:"random_ua"`
}

type ScanController struct {
	DB *gorm.DB
}

func NewScanController(db *gorm.DB) *ScanController {
	return &ScanController{DB: db}
}

func (sc *ScanController) ScanSite(c *gin.Context) {
	var req ScanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// URL Normalizasyonu
	req.URL = scraper.NormalizeURL(req.URL)
	startTime := time.Now()
	utils.LogInfo(sc.DB, "SCANNER", fmt.Sprintf("Tarama başlatıldı: %s", req.URL))

	// Tor Proxy Hazırlığı
	torProxy := os.Getenv("TOR_PROXY")
	if torProxy == "" {
		activeProxy, err := scraper.GetActiveTorProxy()
		if err != nil {
			utils.LogError(sc.DB, "SCANNER", "Aktif Tor proxy bulunamadı.")
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		torProxy = activeProxy
	}
	utils.LogInfo(sc.DB, "SCANNER", fmt.Sprintf("Proxy bağlantısı kuruldu: %s", torProxy))

	// Keywordleri Getir
	var keywords []models.Keyword
	sc.DB.Find(&keywords)

	var userAgents []string
	if req.RandomUA {
		var uaList []models.UserAgent
		sc.DB.Find(&uaList)
		for _, ua := range uaList {
			userAgents = append(userAgents, ua.UserAgent)
		}
	}

	result, err := scraper.AnalyzeSite(req.URL, torProxy, keywords, userAgents)
	if err != nil {
		sc.handleScanError(c, err, torProxy)
		return
	}

	if result.ErrorMessage != "" {
		utils.LogError(sc.DB, "SCANNER", fmt.Sprintf("Erişim hatası: %s", result.ErrorMessage))
		c.JSON(http.StatusBadGateway, gin.H{
			"error": "Siteye Erişilemedi (" + torProxy + "): " + result.ErrorMessage,
		})
		return
	}

	sc.processScanResult(c, result, startTime)
}

// Hata Yanıtı (JSON)
func (sc *ScanController) handleScanError(c *gin.Context, err error, proxy string) {
	errStr := err.Error()
	status := http.StatusInternalServerError
	var userMsg string

	if scraper.IsProxyConnectionError(err) {
		userMsg = "Tor Ağına Bağlanılamadı. Lütfen Tor Browser'ın açık olduğundan emin olun."
		utils.LogError(sc.DB, "SCANNER", "Tor ağına bağlanılamadı.")
	} else {
		status = http.StatusBadGateway
		userMsg = "Site Taranamadı: " + errStr
		utils.LogError(sc.DB, "SCANNER", fmt.Sprintf("Site tarama hatası: %s", errStr))
	}

	c.JSON(status, gin.H{"error": userMsg, "details": errStr})
}

// Sonuç İşleme (JSON)
func (sc *ScanController) processScanResult(c *gin.Context, result *scraper.ScrapeResult, startTime time.Time) {
	if !result.IsForum {
		duration := time.Since(startTime)
		utils.LogWarn(sc.DB, "SCANNER", fmt.Sprintf("Hedef forum yapısına uymuyor: %s (Süre: %.2fs)", result.URL, duration.Seconds()))
		c.JSON(http.StatusOK, gin.H{
			"message":  "Site forum değil. Veri kaydedilmedi.",
			"data":     result,
			"saved":    false,
			"duration": duration.Seconds(),
		})
		return
	}

	duration := time.Since(startTime)
	sc.saveToDB(result)

	utils.LogSuccess(sc.DB, "SCANNER", fmt.Sprintf("Tarama tamamlandı: %s (Süre: %.2fs)", result.URL, duration.Seconds()))

	c.JSON(http.StatusOK, gin.H{
		"message":  "Forum algılandı ve başarıyla kaydedildi",
		"data":     result,
		"saved":    true,
		"duration": duration.Seconds(),
	})
}

// Veritabanına Kayıt
func (sc *ScanController) saveToDB(result *scraper.ScrapeResult) {
	site := models.Site{
		URL:      result.URL,
		LastScan: time.Now(),
	}
	sc.DB.Where(models.Site{URL: result.URL}).Assign(models.Site{
		LastScan: time.Now(),
	}).FirstOrCreate(&site)

	stats := models.Stats{
		SiteID:       site.ID,
		Source:       "manual", // Manuel tarama
		TotalThreads: result.ThreadCount,
		TotalPosts:   result.PostCount,
		ScanDate:     time.Now(),
	}
	sc.DB.Create(&stats)

	go func(siteID, statsID uint, threads []scraper.ThreadData) {
		for _, t := range threads {
			thread := models.Thread{
				SiteID: siteID, StatsID: statsID, Title: t.Title, Link: t.Link,
				Author: t.Author, Date: t.Date, Category: t.Category,
			}
			sc.DB.Create(&thread)
			for i, p := range t.Posts {
				sc.DB.Create(&models.Post{
					ThreadID: thread.ID, Author: p.Author, Content: p.Content,
					Date: p.Date, Order: i + 1,
				})
			}
		}
	}(site.ID, stats.ID, result.Threads)
}
