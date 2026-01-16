package utils

import (
	"scraper/models"

	"gorm.io/gorm"
)

func LogInfo(db *gorm.DB, message string) {
	db.Create(&models.SystemLog{Level: "INFO", Message: message})
}

func LogSuccess(db *gorm.DB, message string) {
	db.Create(&models.SystemLog{Level: "SUCCESS", Message: message})
}

func LogError(db *gorm.DB, message string) {
	db.Create(&models.SystemLog{Level: "ERROR", Message: message})
}

func LogWarn(db *gorm.DB, message string) {
	db.Create(&models.SystemLog{Level: "WARN", Message: message})
}
