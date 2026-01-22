package utils

import (
	"log"
	"scraper/models"

	"gorm.io/gorm"
)

func LogInfo(db *gorm.DB, source, message string) {
	if err := db.Create(&models.SystemLog{Level: "INFO", Source: source, Message: message}).Error; err != nil {
		log.Printf("LogInfo Failed: %v", err)
	}
}

func LogSuccess(db *gorm.DB, source, message string) {
	if err := db.Create(&models.SystemLog{Level: "SUCCESS", Source: source, Message: message}).Error; err != nil {
		log.Printf("LogSuccess Failed: %v", err)
	}
}

func LogError(db *gorm.DB, source, message string) {
	if err := db.Create(&models.SystemLog{Level: "ERROR", Source: source, Message: message}).Error; err != nil {
		log.Printf("LogError Failed: %v", err)
	}
}

func LogWarn(db *gorm.DB, source, message string) {
	if err := db.Create(&models.SystemLog{Level: "WARN", Source: source, Message: message}).Error; err != nil {
		log.Printf("LogWarn Failed: %v", err)
	}
}
