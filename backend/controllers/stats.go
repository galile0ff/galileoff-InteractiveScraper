package controllers

import (
	"fmt"
	"net/http"
	"runtime"
	"scraper/models"
	"scraper/scraper"
	"scraper/utils"
	"time"

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

	// Son 7 Tarama
	type RecentScan struct {
		ID       uint      `json:"id"`
		URL      string    `json:"url"`
		IsForum  bool      `json:"is_forum"`
		Source   string    `json:"source"`
		Category string    `json:"category"`
		ScanDate time.Time `json:"scan_date"`
	}
	var recentScans []RecentScan
	ctrl.DB.Table("stats").
		Select("stats.id, sites.url, sites.is_forum, stats.source, stats.scan_date, (SELECT category FROM threads WHERE threads.stats_id = stats.id LIMIT 1) as category").
		Joins("left join sites on sites.id = stats.site_id").
		Order("stats.scan_date desc").
		Limit(7).
		Scan(&recentScans)

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
		Order("stats.scan_date desc").
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

	// --- Genel Toplamlar ---
	var pageCount int64
	ctrl.DB.Model(&models.Stats{}).Count(&pageCount)

	type TotalStats struct {
		TotalThreads int64
		TotalPosts   int64
	}
	var totals TotalStats
	ctrl.DB.Model(&models.Stats{}).Select("COALESCE(SUM(total_threads), 0) as total_threads, COALESCE(SUM(total_posts), 0) as total_posts").Scan(&totals)

	c.JSON(http.StatusOK, gin.H{
		"site_count":   siteCount,
		"page_count":   pageCount,           // İndeksli İçerik
		"thread_count": totals.TotalThreads, // Konu Başlığı
		"post_count":   totals.TotalPosts,   // Analiz Edilen Veri
		"recent_sites": recentScans,         // Son taramalar

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
