package controllers

import (
	"net/http"
	"scraper/models"
	"scraper/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SettingsController struct {
	DB *gorm.DB
}

func NewSettingsController(db *gorm.DB) *SettingsController {
	return &SettingsController{DB: db}
}

// ResetDatabase: Veritabanındaki tüm verileri temizler
func (ctrl *SettingsController) ResetDatabase(c *gin.Context) {
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
	tables := []string{"posts", "threads", "stats", "sites", "system_logs"}

	for _, table := range tables {
		if err := tx.Exec("DELETE FROM " + table).Error; err != nil {
			tx.Rollback()
			utils.LogError(ctrl.DB, "Veritabanı sıfırlama hatası: "+err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Tablo temizlenemedi: " + table})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "İşlem kaydedilemedi"})
		return
	}

	utils.LogSuccess(ctrl.DB, "Sistem veritabanı başarıyla sıfırlandı.")
	c.JSON(http.StatusOK, gin.H{"message": "Veritabanı başarıyla sıfırlandı."})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Keyword eklenemedi"})
		return
	}

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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Keyword güncellenemedi"})
		return
	}

	c.JSON(http.StatusOK, keyword)
}

// DeleteKeyword: Bir anahtar kelimeyi siler
func (ctrl *SettingsController) DeleteKeyword(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.DB.Delete(&models.Keyword{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Keyword silinemedi"})
		return
	}
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User Agent eklenemedi"})
		return
	}

	c.JSON(http.StatusOK, input)
}

// DeleteUserAgent: Bir User Agent siler
func (ctrl *SettingsController) DeleteUserAgent(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.DB.Delete(&models.UserAgent{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User Agent silinemedi"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User Agent silindi"})
}
