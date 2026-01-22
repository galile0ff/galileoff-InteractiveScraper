package scraper

import (
	"net/url"
	"strings"
)

// NormalizeURL, verilen urlin başında http/https ve sonunda .onion gibi uzantıların olup olmadığını kontrol eder ve eksikse tamamlar.
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

	// 1. Sondaki tüm noktaları temizle (örn: site.. -> site)
	host = strings.TrimRight(host, ".")

	// 2. Eğer .onion ile bitmiyorsa, .onion ekle
	if !strings.HasSuffix(host, ".onion") {
		host = host + ".onion"
	}

	u.Host = host
	return u.String()
}

// cleanText, metin içindeki fazla boşlukları temizler ancak satır yapılarını korur
func cleanText(text string) string {
	// 1. Sağ/Sol boşlukları sil
	text = strings.TrimSpace(text)

	// 2. HTML kirlilikleri
	text = strings.ReplaceAll(text, "\u00A0", " ") // Non-breaking space

	// 3. Satırlara böl ve her satırı temizle
	lines := strings.Split(text, "\n")
	var cleanedLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Boş satırları atla
		if trimmed == "" {
			continue
		}

		// Filtreleme: Gereksiz satırları atla
		// 1. Post numarası (örn: #1, #106)
		if strings.HasPrefix(trimmed, "#") && len(trimmed) < 10 {
			continue
		}

		// 2. Last edited
		if strings.HasPrefix(trimmed, "Last edited:") || strings.HasPrefix(trimmed, "Son düzenleme:") {
			continue
		}

		// 3. Reactions
		if strings.HasPrefix(trimmed, "Reactions:") || strings.HasPrefix(trimmed, "Tepkiler:") {
			continue
		}
		cleanedLines = append(cleanedLines, trimmed)
	}

	// 4. Temiz satırları birleştir
	return strings.Join(cleanedLines, "\n")
}
