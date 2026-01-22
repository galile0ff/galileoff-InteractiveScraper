package controllers

import (
	"fmt"
	"net/http"
	"scraper/models"
	"scraper/scraper"
	"scraper/utils"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SettingsController struct {
	DB *gorm.DB
}

func NewSettingsController(db *gorm.DB) *SettingsController {
	return &SettingsController{DB: db}
}

// ResetOptions: Silme seçenekleri
type ResetOptions struct {
	History  bool `json:"history"`
	Logs     bool `json:"logs"`
	Settings bool `json:"settings"`
}

// ResetDatabase: Veritabanındaki seçilen verileri temizler
func (ctrl *SettingsController) ResetDatabase(c *gin.Context) {
	var options ResetOptions
	if err := c.ShouldBindJSON(&options); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz istek formatı"})
		return
	}

	// Eğer hiçbiri seçilmemişse
	if !options.History && !options.Logs && !options.Settings {
		c.JSON(http.StatusBadRequest, gin.H{"error": "En az bir temizleme seçeneği işaretlenmelidir"})
		return
	}

	// Transaction başlat
	tx := ctrl.DB.Begin()

	// Hata olursa rollback yap
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Veritabanı işlemi başlatılamadı"})
		return
	}

	// Tabloları temizle
	var successMsg string

	if options.History {
		historyTables := []string{"posts", "threads", "stats", "sites"}
		for _, table := range historyTables {
			if err := tx.Exec("DELETE FROM " + table).Error; err != nil {
				tx.Rollback()
				utils.LogError(ctrl.DB, "SYSTEM", "Veritabanı geçmiş temizleme hatası: "+err.Error())
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Tablo temizlenemedi: " + table})
				return
			}
		}
		successMsg += "Geçmiş, "
	}

	if options.Logs {
		if err := tx.Exec("DELETE FROM system_logs").Error; err != nil {
			tx.Rollback()
			utils.LogError(ctrl.DB, "SYSTEM", "Log temizleme hatası: "+err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Loglar temizlenemedi"})
			return
		}
		successMsg += "Loglar, "
	}

	if options.Settings {
		settingsTables := []string{"keywords", "user_agents", "watchlists"}
		for _, table := range settingsTables {
			if err := tx.Exec("DELETE FROM " + table).Error; err != nil {
				tx.Rollback()
				utils.LogError(ctrl.DB, "SYSTEM", "Ayarlar sıfırlama hatası: "+err.Error())
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ayarlar temizlenemedi: " + table})
				return
			}
		}
		successMsg += "Ayarlar, "
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "İşlem kaydedilemedi"})
		return
	}

	if len(successMsg) > 2 {
		successMsg = successMsg[:len(successMsg)-2] // Son virgülü kaldır
	}

	utils.LogSuccess(ctrl.DB, "SYSTEM", "Sistem veritabanı temizlendi: "+successMsg)
	c.JSON(http.StatusOK, gin.H{"message": "Veritabanı temizlendi: " + successMsg})
}

// GetKeywords: Tüm anahtar kelimeleri listeler
func (ctrl *SettingsController) GetKeywords(c *gin.Context) {
	var keywords []models.Keyword
	if err := ctrl.DB.Find(&keywords).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Keywords getirilemedi"})
		return
	}
	c.JSON(http.StatusOK, keywords)
}

// AddKeyword: Yeni bir anahtar kelime ekler
func (ctrl *SettingsController) AddKeyword(c *gin.Context) {
	var input models.Keyword
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.DB.Create(&input).Error; err != nil {
		utils.LogError(ctrl.DB, "SETTINGS", "Keyword eklenemedi: "+input.Word)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Keyword eklenemedi"})
		return
	}

	utils.LogInfo(ctrl.DB, "SETTINGS", fmt.Sprintf("Keyword eklendi: %s (%s)", input.Word, input.Category))
	c.JSON(http.StatusOK, input)
}

// UpdateKeyword: Mevcut bir anahtar kelimeyi günceller
func (ctrl *SettingsController) UpdateKeyword(c *gin.Context) {
	id := c.Param("id")
	var keyword models.Keyword

	if err := ctrl.DB.First(&keyword, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Keyword bulunamadı"})
		return
	}

	var input models.Keyword
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	keyword.Word = input.Word
	keyword.Category = input.Category
	keyword.Color = input.Color // Renk güncellemesi

	if err := ctrl.DB.Save(&keyword).Error; err != nil {
		utils.LogError(ctrl.DB, "SETTINGS", "Keyword güncellenemedi: "+keyword.Word)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Keyword güncellenemedi"})
		return
	}

	utils.LogInfo(ctrl.DB, "SETTINGS", "Keyword güncellendi: "+keyword.Word)
	c.JSON(http.StatusOK, keyword)
}

// DeleteKeyword: Bir anahtar kelimeyi siler
func (ctrl *SettingsController) DeleteKeyword(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.DB.Delete(&models.Keyword{}, id).Error; err != nil {
		utils.LogError(ctrl.DB, "SETTINGS", "Keyword silinemedi ID: "+id)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Keyword silinemedi"})
		return
	}
	utils.LogInfo(ctrl.DB, "SETTINGS", "Keyword silindi ID: "+id)
	c.JSON(http.StatusOK, gin.H{"message": "Keyword silindi"})
}

// GetUserAgents: Tüm User Agentları listeler
func (ctrl *SettingsController) GetUserAgents(c *gin.Context) {
	var userAgents []models.UserAgent
	if err := ctrl.DB.Find(&userAgents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User Agentlar getirilemedi"})
		return
	}
	c.JSON(http.StatusOK, userAgents)
}

// AddUserAgent: Yeni bir User Agent ekler
func (ctrl *SettingsController) AddUserAgent(c *gin.Context) {
	var input models.UserAgent
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.DB.Create(&input).Error; err != nil {
		utils.LogError(ctrl.DB, "SETTINGS", "User Agent eklenemedi")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User Agent eklenemedi"})
		return
	}

	utils.LogInfo(ctrl.DB, "SETTINGS", "User Agent eklendi")
	c.JSON(http.StatusOK, input)
}

// UpdateUserAgent: Mevcut bir User Agent'ı günceller
func (ctrl *SettingsController) UpdateUserAgent(c *gin.Context) {
	id := c.Param("id")
	var userAgent models.UserAgent

	if err := ctrl.DB.First(&userAgent, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User Agent bulunamadı"})
		return
	}

	var input models.UserAgent
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userAgent.UserAgent = input.UserAgent
	if err := ctrl.DB.Save(&userAgent).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User Agent güncellenemedi"})
		return
	}

	c.JSON(http.StatusOK, userAgent)
}

// DeleteUserAgent: Bir User Agent siler
func (ctrl *SettingsController) DeleteUserAgent(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.DB.Delete(&models.UserAgent{}, id).Error; err != nil {
		utils.LogError(ctrl.DB, "SETTINGS", "User Agent silinemedi ID: "+id)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User Agent silinemedi"})
		return
	}
	utils.LogInfo(ctrl.DB, "SETTINGS", "User Agent silindi ID: "+id)
	c.JSON(http.StatusOK, gin.H{"message": "User Agent silindi"})
}

// GetWatchlist: Tüm watchlist öğelerini listeler
func (ctrl *SettingsController) GetWatchlist(c *gin.Context) {
	var watchlist []models.Watchlist
	if err := ctrl.DB.Find(&watchlist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Watchlist getirilemedi"})
		return
	}
	c.JSON(http.StatusOK, watchlist)
}

// AddWatchlistItem: Yeni bir watchlist öğesi ekler
func (ctrl *SettingsController) AddWatchlistItem(c *gin.Context) {
	var input models.Watchlist
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// URL'i normalize et
	input.URL = scraper.NormalizeURL(input.URL)

	// İlk ekleme için next_check zamanını hesapla
	if input.IntervalMinutes > 0 {
		nextCheck := time.Now().Add(time.Duration(input.IntervalMinutes) * time.Minute)
		input.NextCheck = &nextCheck
	}

	if err := ctrl.DB.Create(&input).Error; err != nil {
		utils.LogError(ctrl.DB, "SETTINGS", "Watchlist eklenemedi: "+input.URL)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Watchlist öğesi eklenemedi"})
		return
	}

	utils.LogInfo(ctrl.DB, "SETTINGS", "Watchlist eklendi: "+input.URL)
	c.JSON(http.StatusOK, input)
}

// UpdateWatchlistItem: Mevcut bir watchlist öğesini günceller
func (ctrl *SettingsController) UpdateWatchlistItem(c *gin.Context) {
	id := c.Param("id")
	var watchlistItem models.Watchlist

	if err := ctrl.DB.First(&watchlistItem, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Watchlist öğesi bulunamadı"})
		return
	}

	var input models.Watchlist
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// URL'i normalize et
	watchlistItem.URL = scraper.NormalizeURL(input.URL)
	watchlistItem.IntervalMinutes = input.IntervalMinutes
	watchlistItem.Description = input.Description

	// Interval değiştirilmişse next_check'i yeniden hesapla
	if input.IntervalMinutes > 0 {
		nextCheck := time.Now().Add(time.Duration(input.IntervalMinutes) * time.Minute)
		watchlistItem.NextCheck = &nextCheck
	}

	if err := ctrl.DB.Save(&watchlistItem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Watchlist öğesi güncellenemedi"})
		return
	}

	c.JSON(http.StatusOK, watchlistItem)
}

// DeleteWatchlistItem: Bir watchlist öğesini siler
func (ctrl *SettingsController) DeleteWatchlistItem(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.DB.Delete(&models.Watchlist{}, id).Error; err != nil {
		utils.LogError(ctrl.DB, "SETTINGS", "Watchlist silinemedi ID: "+id)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Watchlist öğesi silinemedi"})
		return
	}
	utils.LogInfo(ctrl.DB, "SETTINGS", "Watchlist silindi ID: "+id)
	c.JSON(http.StatusOK, gin.H{"message": "Watchlist öğesi silindi"})
}

// ToggleAllWatchlist: Tüm watchlist öğelerinin is_active değerini günceller
func (ctrl *SettingsController) ToggleAllWatchlist(c *gin.Context) {
	var input struct {
		IsActive bool `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Tüm watchlist öğelerini güncelle
	if err := ctrl.DB.Model(&models.Watchlist{}).Where("id > ?", 0).Updates(map[string]interface{}{"is_active": input.IsActive}).Error; err != nil {
		utils.LogError(ctrl.DB, "SETTINGS", "Watchlist durumu güncellenemedi")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Watchlist güncellenemedi"})
		return
	}

	state := "Aktif"
	if !input.IsActive {
		state = "Pasif"
	}
	utils.LogInfo(ctrl.DB, "SETTINGS", fmt.Sprintf("Tüm Watchlist durumu değiştirildi: %s", state))
	c.JSON(http.StatusOK, gin.H{"message": "Tüm watchlist öğeleri güncellendi"})
}
