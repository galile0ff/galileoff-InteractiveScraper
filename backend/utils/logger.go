package utils

import (
	"scraper/models"

	"gorm.io/gorm"
)

func LogInfo(db *gorm.DB, source, message string) {
	db.Create(&models.SystemLog{Level: "INFO", Source: source, Message: message})
}

func LogSuccess(db *gorm.DB, source, message string) {
	db.Create(&models.SystemLog{Level: "SUCCESS", Source: source, Message: message})
}

func LogError(db *gorm.DB, source, message string) {
	db.Create(&models.SystemLog{Level: "ERROR", Source: source, Message: message})
}

func LogWarn(db *gorm.DB, source, message string) {
	db.Create(&models.SystemLog{Level: "WARN", Source: source, Message: message})
}
