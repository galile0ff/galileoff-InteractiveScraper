package controllers

import (
	"net/http"
	"os"
	"scraper/models"
	"scraper/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthController struct {
	DB *gorm.DB
}

func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{DB: db}
}

func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz istek formatı."})
		return
	}

	var user models.User
	// Kullanıcıyı bul
	if err := ac.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		utils.LogWarn(ac.DB, "AUTH", "Bilinmeyen kullanıcı giriş denemesi: "+req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Hatalı kullanıcı adı veya şifre."})
		return
	}

	// Şifreyi doğrula
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		utils.LogWarn(ac.DB, "AUTH", "Hatalı şifre denemesi: "+req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Hatalı kullanıcı adı veya şifre."})
		return
	}

	// Token oluştur
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 2).Unix(), // 2 saat geçerli
	})

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Sunucu yapılandırma hatası."})
		return
	}

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		utils.LogError(ac.DB, "AUTH", "Token oluşturma hatası: "+err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token oluşturulamadı."})
		return
	}

	utils.LogSuccess(ac.DB, "AUTH", "Başarılı giriş: "+user.Username)

	c.JSON(http.StatusOK, gin.H{
		"message": "Giriş başarılı",
		"token":   tokenString,
		"user":    user.Username,
	})
}
