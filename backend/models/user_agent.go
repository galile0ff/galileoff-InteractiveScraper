package models

import "gorm.io/gorm"

type UserAgent struct {
	gorm.Model
	UserAgent string `json:"user_agent"`
}
