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
	URL string `json:"url" binding:"required"`
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

	// URL Normalizasyonu (https ve .onion ekle)
	req.URL = scraper.NormalizeURL(req.URL)
	utils.LogInfo(sc.DB, fmt.Sprintf("Tarama isteği alındı: %s", req.URL))

	// 1. Sitenin var olup olmadığını kontrol et
	var existingSite models.Site
	if result := sc.DB.Where("url = ?", req.URL).First(&existingSite); result.Error == nil {
		utils.LogInfo(sc.DB, fmt.Sprintf("Hedef veritabanında mevcut: %s", req.URL))
	}

	// 2. Taramayı Başlat
	torProxy := os.Getenv("TOR_PROXY")

	// Eğer env tanımlı değilse, aktif portu otomatik bul
	if torProxy == "" {
		activeProxy, err := scraper.GetActiveTorProxy()
		if err != nil {
			utils.LogError(sc.DB, "Aktif Tor proxy bulunamadı.")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}
		torProxy = activeProxy
	}
	utils.LogInfo(sc.DB, fmt.Sprintf("Proxy bağlantısı kuruldu: %s", torProxy))

	result, err := scraper.AnalyzeSite(req.URL, torProxy)

	if err != nil {
		errStr := err.Error()
		status := http.StatusInternalServerError

		var userMsg string
		if scraper.IsProxyConnectionError(err) {
			userMsg = "Tor Ağına Bağlanılamadı. Lütfen Tor Browser'ın açık olduğundan emin olun."
			utils.LogError(sc.DB, "Tor ağına bağlanılamadı.")
		} else {
			status = http.StatusBadGateway
			userMsg = "Site Taranamadı: " + errStr
			utils.LogError(sc.DB, fmt.Sprintf("Site tarama hatası: %s", errStr))
		}

		c.JSON(status, gin.H{
			"error":   userMsg,
			"details": errStr,
		})
		return
	}

	if result.ErrorMessage != "" {
		utils.LogError(sc.DB, fmt.Sprintf("Erişim hatası: %s", result.ErrorMessage))
		c.JSON(http.StatusBadGateway, gin.H{
			"error": "Siteye Erişilemedi (" + torProxy + "): " + result.ErrorMessage,
		})
		return
	}

	// 3. Forum olup olmadığını kontrol et
	if !result.IsForum {
		utils.LogWarn(sc.DB, fmt.Sprintf("Hedef forum yapısına uymuyor: %s", req.URL))
		c.JSON(http.StatusOK, gin.H{
			"message": "Site forum değil. Veri kaydedilmedi.",
			"data":    result,
			"saved":   false,
		})
		return
	}

	// 4. Veritabanına Kaydet
	site := models.Site{
		URL:      result.URL,
		IsForum:  true,
		LastScan: time.Now(),
	}

	if err := sc.DB.Where(models.Site{URL: result.URL}).FirstOrCreate(&site).Error; err != nil {
		utils.LogError(sc.DB, "Veritabanı kayıt hatası.")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB Kaydetme Hatası: " + err.Error()})
		return
	}

	// Stats oluştur
	stats := models.Stats{
		SiteID:       site.ID,
		TotalThreads: result.ThreadCount,
		TotalPosts:   result.PostCount,
		ScanDate:     time.Now(),
	}
	sc.DB.Create(&stats)

	utils.LogSuccess(sc.DB, fmt.Sprintf("Analiz tamamlandı. %d Konu, %d İleti.", result.ThreadCount, result.PostCount))

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum algılandı ve başarıyla kaydedildi",
		"data":    result,
		"saved":   true,
	})
}
