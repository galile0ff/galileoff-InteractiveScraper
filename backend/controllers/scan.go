package controllers

import (
	"net/http"
	"os"
	"scraper/models"
	"scraper/scraper"
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

	// 1. Sitenin var olup olmadığını kontrol et
	var existingSite models.Site
	if result := sc.DB.Where("url = ?", req.URL).First(&existingSite); result.Error == nil {
	}

	// 2. Taramayı Başlat
	torProxy := os.Getenv("TOR_PROXY")

	// Tarama için varsayılan port
	if torProxy == "" {
		torProxy = "socks5://127.0.0.1:9050"
	}

	result, err := scraper.AnalyzeSite(req.URL, torProxy)

	// Tarama için yedek port
	if (err != nil || result.ErrorMessage != "") && torProxy == "socks5://127.0.0.1:9050" {
		altProxy := "socks5://127.0.0.1:9150"
		// 9150 ile tekrar dene
		resultAlt, errAlt := scraper.AnalyzeSite(req.URL, altProxy)
		if errAlt == nil && resultAlt.ErrorMessage == "" {
			result = resultAlt
			err = nil
			torProxy = altProxy // Loglama için proxy değişkenini güncelle
		}
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Tor Network Hatası: Bağlantı kurulamadı. (Denenen Portlar: 9050 ve 9150). Tor Browser açık mı? Hata Detayı: " + err.Error(),
		})
		return
	}

	if result.ErrorMessage != "" {
		c.JSON(http.StatusBadGateway, gin.H{
			"error": "Siteye Erişilemedi (" + torProxy + "): " + result.ErrorMessage,
		})
		return
	}

	// 3. Forum olup olmadığını kontrol et
	if !result.IsForum {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB Kaydetme Hatası: " + err.Error()})
		return
	}

	// Create Stats snapshot
	stats := models.Stats{
		SiteID:       site.ID,
		TotalThreads: result.ThreadCount,
		TotalPosts:   result.PostCount,
		ScanDate:     time.Now(),
	}
	sc.DB.Create(&stats)

	c.JSON(http.StatusOK, gin.H{
		"message": "Forum algılandı ve başarıyla kaydedildi",
		"data":    result,
		"saved":   true,
	})
}
