package controllers

import (
	"net/http"
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
