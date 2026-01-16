package controllers

import (
	"fmt"
	"net/http"
	"runtime"
	"scraper/models"
	"scraper/scraper"
	"scraper/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StatsController struct {
	DB *gorm.DB
}

func NewStatsController(db *gorm.DB) *StatsController {
	return &StatsController{DB: db}
}

func (ctrl *StatsController) GetGeneralStats(c *gin.Context) {
	var siteCount int64

	// Site Sayısı
	if err := ctrl.DB.Model(&models.Site{}).Count(&siteCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count sites"})
		return
	}

	// Son 5 Site
	var lastSites []models.Site
	if err := ctrl.DB.Order("created_at desc").Limit(5).Find(&lastSites).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recent sites"})
		return
	}

	// --- İçerik Hacmi (Son 10 Site) ---
	type ContentStat struct {
		Name    string `json:"name"`
		Threads int    `json:"threads"`
		Posts   int    `json:"posts"`
	}
	var contentVolume []ContentStat

	// Son taranan 10 sitenin verilerini al (Stats tablosundan)
	type SiteStats struct {
		URL          string
		TotalThreads int
		TotalPosts   int
	}

	var volumes []SiteStats
	ctrl.DB.Table("stats").
		Select("sites.url, stats.total_threads, stats.total_posts").
		Joins("left join sites on sites.id = stats.site_id").
		Order("stats.created_at desc").
		Limit(10).
		Scan(&volumes)

	for _, v := range volumes {
		// URL'yi kısalt
		shortName := v.URL
		if len(v.URL) > 20 {
			shortName = v.URL[:8] + "..." + v.URL[len(v.URL)-8:]
		}

		contentVolume = append(contentVolume, ContentStat{
			Name:    shortName,
			Threads: v.TotalThreads,
			Posts:   v.TotalPosts,
		})
	}

	// Grafik terse doğru (eskiden yeniye) aksın
	for i, j := 0, len(contentVolume)-1; i < j; i, j = i+1, j-1 {
		contentVolume[i], contentVolume[j] = contentVolume[j], contentVolume[i]
	}

	// --- Tür Dağılımı ---
	var forumCount int64
	ctrl.DB.Model(&models.Site{}).Where("is_forum = ?", true).Count(&forumCount)

	// --- Sistem Durumu ---
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	// MB'ye çevir
	memUsage := m.Alloc / 1024 / 1024

	uptime := utils.GetUptime()
	uptimeStr := fmt.Sprintf("%dh %dm", int(uptime.Hours()), int(uptime.Minutes())%60)

	// Goroutine sayısını göster
	goroutines := runtime.NumGoroutine()

	// Tor Bağlantısı Kontrolü
	torStatus := "PASİF"
	if _, err := scraper.GetActiveTorProxy(); err == nil {
		torStatus = "AKTİF"
	}

	c.JSON(http.StatusOK, gin.H{
		"site_count":     siteCount,
		"recent_sites":   lastSites,
		"content_volume": contentVolume,
		"distribution": gin.H{
			"forums": forumCount,
			"sites":  siteCount - forumCount,
		},
		"system_status": gin.H{
			"cpu":        goroutines,
			"memory":     memUsage,
			"network":    "ONLINE",
			"uptime":     uptimeStr,
			"tor_status": torStatus,
		},
	})
}

func (ctrl *StatsController) GetSystemLogs(c *gin.Context) {
	var logs []models.SystemLog
	if err := ctrl.DB.Order("created_at desc").Limit(20).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}
	c.JSON(http.StatusOK, logs)
}
