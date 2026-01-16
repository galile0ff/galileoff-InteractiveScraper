package scraper

import (
	"fmt"
	"log"
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

func AnalyzeSite(targetURL string, torProxy string) (*ScrapeResult, error) {
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
		if e.DOM.Find(".thread").Length() > 0 || e.DOM.Find(".post").Length() > 0 || e.DOM.Find("#forums").Length() > 0 {
			keywordCount += 2
		}

		if keywordCount >= 3 {
			result.IsForum = true
		}
	})

	// Hata yönetimi
	c.OnError(func(r *colly.Response, err error) {
		log.Printf("Request URL: %s failed with %v", r.Request.URL, err)
		result.ErrorMessage = err.Error()
	})

	err := c.Visit(targetURL)
	if err != nil {
		return nil, err
	}

	return result, nil
}
