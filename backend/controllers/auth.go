package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthController struct{}

func NewAuthController() *AuthController {
	return &AuthController{}
}

func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz istek formatı."})
		return
	}

	// Şuanlık Böyle Kalsın
	if req.Username == "admin" && req.Password == "12345" {
		c.JSON(http.StatusOK, gin.H{
			"message": "Giriş başarılı",
			"token":   "dummy-token-12345",
			"user":    req.Username,
		})
		return
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "Hatalı kullanıcı adı veya şifre."})
}
