package controllers

import (
	"net/http"
	"scraper/models"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HistoryController struct {
	DB *gorm.DB
}

func NewHistoryController(db *gorm.DB) *HistoryController {
	return &HistoryController{DB: db}
}

// GetHistory: Tüm tarama geçmişini listeler
func (ctrl *HistoryController) GetHistory(c *gin.Context) {

	type HistoryItem struct {
		ID           uint      `json:"id"` // Stats ID
		URL          string    `json:"url"`
		IsForum      bool      `json:"is_forum"`
		Source       string    `json:"source"`    // manual veya watchlist
		LastScan     time.Time `json:"last_scan"` // Stats.ScanDate
		TotalThreads int       `json:"total_threads"`
		TotalPosts   int       `json:"total_posts"`
		Category     string    `json:"category"`
	}

	var history []HistoryItem

	// Stats tablosunu ana tablo olarak kullan
	ctrl.DB.Table("stats").
		Select("stats.id, sites.url, sites.is_forum, stats.source, stats.scan_date as last_scan, stats.total_threads, stats.total_posts, (SELECT category FROM threads WHERE threads.stats_id = stats.id LIMIT 1) as category").
		Joins("left join sites on stats.site_id = sites.id").
		Order("stats.scan_date desc").
		Scan(&history)

	c.JSON(http.StatusOK, history)
}

// GetScanDetails: Belirli bir taramanın (StatsID) sonuçlarını getirir
func (ctrl *HistoryController) GetScanDetails(c *gin.Context) {
	id := c.Param("id") // StatsID

	type ScanDetailsResponse struct {
		ID           uint            `json:"id"`        // Stats ID
		SiteUrl      string          `json:"url"`       // Site URL
		ScanDate     time.Time       `json:"scan_date"` // Tarama Tarihi
		TotalThreads int             `json:"total_threads"`
		TotalPosts   int             `json:"total_posts"`
		Threads      []models.Thread `json:"threads"`
	}

	// 1. Önce Stats bilgisini ve Site bilgisini çek
	var stats models.Stats
	if err := ctrl.DB.Preload("Site").First(&stats, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tarama kaydı bulunamadı"})
		return
	}

	// 2. Bu taramaya ait Thread'leri çek
	var threads []models.Thread
	ctrl.DB.Where("stats_id = ?", stats.ID).Preload("Posts").Find(&threads)

	// 3. Yanıtı oluştur
	response := ScanDetailsResponse{
		ID:           stats.ID,
		SiteUrl:      stats.Site.URL,
		ScanDate:     stats.ScanDate,
		TotalThreads: stats.TotalThreads,
		TotalPosts:   stats.TotalPosts,
		Threads:      threads,
	}

	c.JSON(http.StatusOK, response)
}
