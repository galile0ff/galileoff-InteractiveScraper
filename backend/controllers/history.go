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
		ID  uint   `json:"id"`
		URL string `json:"url"`

		// IsForum      bool
		Source       string    `json:"source"`
		LastScan     time.Time `json:"last_scan"`
		TotalThreads int       `json:"total_threads"`
		TotalPosts   int       `json:"total_posts"`
		Category     string    `json:"category"`
		Color        string    `json:"color"`
	}

	var history []HistoryItem

	// 1. Temel verileri çek
	ctrl.DB.Table("stats").
		Select("stats.id, sites.url, stats.source, stats.scan_date as last_scan, stats.total_threads, stats.total_posts, (SELECT category FROM threads WHERE threads.stats_id = stats.id LIMIT 1) as category").
		Joins("left join sites on stats.site_id = sites.id").
		Order("stats.scan_date desc").
		Scan(&history)

	// 2. Kategorilere ait renkleri bul ve eşleştir
	if len(history) > 0 {
		// Benzersiz kategorileri topla
		categoryColors := make(map[string]string)
		var categories []string
		for _, item := range history {
			if item.Category != "" {
				categories = append(categories, item.Category)
			}
		}

		if len(categories) > 0 {
			type CatColor struct {
				Category string
				Color    string
			}
			var catColors []CatColor
			// Her kategori için bir renk seç
			ctrl.DB.Table("keywords").
				Select("category, color").
				Where("category IN ?", categories).
				Group("category").
				Scan(&catColors)

			for _, cc := range catColors {
				categoryColors[cc.Category] = cc.Color
			}

			// Renkleri history öğelerine dağıt
			for i := range history {
				if col, ok := categoryColors[history[i].Category]; ok {
					history[i].Color = col
				}
			}
		}
	}

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
