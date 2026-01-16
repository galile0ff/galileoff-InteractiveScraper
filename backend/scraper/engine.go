package scraper

import (
	"fmt"
	"log"
	"net"
	"strings"
	"time"

	"github.com/gocolly/colly/v2"
	"github.com/gocolly/colly/v2/proxy"
)

type ScrapeResult struct {
	URL          string
	IsForum      bool
	Title        string
	ThreadCount  int
	PostCount    int
	ErrorMessage string
}

// AnalyzeSite, hedef siteyi tarar ve sonuçları döndürür.
func AnalyzeSite(targetURL string, torProxy string) (*ScrapeResult, error) {
	var result *ScrapeResult
	var err error
	maxRetries := 3

	for i := 0; i < maxRetries; i++ {
		// Loglama: Deneme sayısı
		if i > 0 {
			log.Printf("Yeniden deneniyor (%d/%d): %s", i+1, maxRetries, targetURL)
			time.Sleep(2 * time.Second) // Bekleme süresi
		}

		result, err = performScan(targetURL, torProxy)

		// Başarılıysa veya kritik olmayan bir hata varsa dön
		if err == nil {
			return result, nil
		}

		errMsg := err.Error()
		if strings.Contains(errMsg, "geçersiz") || strings.Contains(errMsg, "desteklenmeyen") {
			return nil, err
		}
	}

	return nil, fmt.Errorf("Maksimum deneme sayısına ulaşıldı. Son hata: %v", err)
}

func performScan(targetURL string, torProxy string) (*ScrapeResult, error) {
	c := colly.NewCollector(
		colly.AllowURLRevisit(),
	)

	// Zaman aşımını ayarla
	c.SetRequestTimeout(60 * time.Second)

	// User Agent döndür
	c.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

	// Proxy Yapılandır
	if torProxy != "" {
		rp, err := proxy.RoundRobinProxySwitcher(torProxy)
		if err != nil {
			return nil, fmt.Errorf("proxy error: %v", err)
		}
		c.SetProxyFunc(rp)
	}

	result := &ScrapeResult{
		URL: targetURL,
	}

	// Bir forumu işaret eden anahtar kelimeler
	forumKeywords := []string{"thread", "post", "topic", "forum", "vbulletin", "xenforo", "phpbb", "mybb", "discussion", "board"}

	c.OnHTML("html", func(e *colly.HTMLElement) {
		text := strings.ToLower(e.Text)
		html, _ := e.DOM.Html()
		html = strings.ToLower(html)

		result.Title = e.ChildText("title")

		// Forum tespiti için basit sezgisel yöntem
		keywordCount := 0
		for _, kw := range forumKeywords {
			if strings.Contains(text, kw) || strings.Contains(html, kw) {
				keywordCount++
			}
		}

		// Yaygın forum yapı sınıflarını/ID'lerini kontrol et
		threadLen := e.DOM.Find(".thread").Length()
		postLen := e.DOM.Find(".post").Length()

		if threadLen > 0 || postLen > 0 || e.DOM.Find("#forums").Length() > 0 {
			keywordCount += 2
		}

		if keywordCount >= 3 {
			result.IsForum = true
		}

		// İstatistikleri ata
		if threadLen > 0 {
			result.ThreadCount = threadLen
		} else {
			if result.IsForum {
				result.ThreadCount = len(text) / 500
			}
		}

		if postLen > 0 {
			result.PostCount = postLen
		} else {
			if result.IsForum {
				result.PostCount = len(text) / 100
			}
		}
	})

	// Hata yönetimi
	c.OnError(func(r *colly.Response, err error) {
		log.Printf("Request URL: %s failed with %v", r.Request.URL, err)
		errMsg := err.Error()

		// SOCKS Hata Kodları Analizi
		if strings.Contains(errMsg, "unknown code: 246") || strings.Contains(errMsg, "0xF6") {
			errMsg = "Onion adresi geçersiz veya desteklenmeyen formatta (V2)."
		} else if strings.Contains(errMsg, "timeout") {
			errMsg = "Bağlantı zaman aşımına uğradı. Site çok yavaş veya kapalı."
		} else if strings.Contains(errMsg, "host unreachable") {
			errMsg = "Hedef sunucuya ulaşılamıyor."
		} else if strings.Contains(errMsg, "connection refused") {
			errMsg = "Bağlantı reddedildi. Tor proxy çalışmıyor olabilir."
		} else if strings.Contains(errMsg, "EOF") {
			errMsg = "Sunucu bağlantıyı kesti (Boş Yanıt). Site çevrimdışı veya Tor devresi koptu."
		}

		result.ErrorMessage = errMsg
	})

	err := c.Visit(targetURL)
	if err != nil {
		// Eğer OnError içinde daha anlamlı bir hata mesajı varsa onu döndür
		if result.ErrorMessage != "" {
			return nil, fmt.Errorf("%s", result.ErrorMessage)
		}
		return nil, err
	}

	return result, nil
}

// GetActiveTorProxy, sistemde çalışan Tor bağlantısını (9050 veya 9150) tespit eder.
func GetActiveTorProxy() (string, error) {
	ports := []string{"9050", "9150"}

	for _, port := range ports {
		address := "127.0.0.1:" + port
		conn, err := net.DialTimeout("tcp", address, 500*time.Millisecond)
		if err == nil {
			conn.Close()
			return "socks5://" + address, nil
		}
	}

	return "", fmt.Errorf("Sistem Tor (9050) veya Tor Browser (9150) açık değil. Lütfen Tor bağlantınızı kontrol edin.")
}

// IsProxyConnectionError, hatanın Tor proxy'sine bağlanamama ile ilgili olup olmadığını kontrol eder
func IsProxyConnectionError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	// Proxy bağlantı reddedildi veya bulunamadı hataları
	return strings.Contains(msg, "connection refused") ||
		strings.Contains(msg, "proxyconnect tcp") ||
		strings.Contains(msg, "dial tcp 127.0.0.1")
}
