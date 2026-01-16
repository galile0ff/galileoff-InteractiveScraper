package scraper

import (
	"net/url"
	"strings"
)

// NormalizeURL, verilen URL'in başında http/https ve sonunda .onion gibi uzantıların olup olmadığını kontrol eder ve eksikse tamamlar.
func NormalizeURL(input string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return ""
	}

	// Şema kontrolü (http:// veya https://)
	if !strings.HasPrefix(input, "http://") && !strings.HasPrefix(input, "https://") {
		input = "http://" + input
	}

	// TLD kontrolü
	u, err := url.Parse(input)
	if err != nil {
		return input
	}

	host := u.Host
	if strings.Contains(host, ":") {
		return input
	}

	if !strings.Contains(host, ".") {
		newHost := host + ".onion"

		// URL'yi yeniden oluştur
		u.Host = newHost
		return u.String()
	}

	return input
}
