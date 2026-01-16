package models

import "gorm.io/gorm"

// Kullanıcı Modeli
type User struct {
	gorm.Model
	Username string `json:"username" gorm:"unique"`
	Password string `json:"-"` // Şifre JSON çıktısında görünmemeli
}
