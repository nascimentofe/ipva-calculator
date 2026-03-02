#!/bin/bash
set -e

echo ">> Iniciando build..."

HTML="index.html"
ADS="ads.txt"

if [ -n "$GA_MEASUREMENT_ID" ]; then
    sed -i.bak "s/G-XXXXXXXXXX/$GA_MEASUREMENT_ID/g" "$HTML"
    echo "   ✓ Google Analytics: $GA_MEASUREMENT_ID"
else
    echo "   ⚠ GA_MEASUREMENT_ID não definida (analytics desativado)"
fi

if [ -n "$CLARITY_ID" ]; then
    sed -i.bak "s/CLARITY_ID/$CLARITY_ID/g" "$HTML"
    echo "   ✓ Microsoft Clarity: $CLARITY_ID"
else
    echo "   ⚠ CLARITY_ID não definida (clarity desativado)"
fi

if [ -n "$ADSENSE_PUB_ID" ]; then
    sed -i.bak "s/ca-pub-XXXXXXXXXXXXXXXX/$ADSENSE_PUB_ID/g" "$HTML"
    PUB_NUMBER="${ADSENSE_PUB_ID#ca-}"
    sed -i.bak "s/pub-XXXXXXXXXXXXXXXX/$PUB_NUMBER/g" "$ADS"
    echo "   ✓ AdSense Publisher: $ADSENSE_PUB_ID"
else
    echo "   ⚠ ADSENSE_PUB_ID não definida (ads desativados)"
fi

# ---- Adsterra Native Banners (CPM) ----
# Each zone needs two env vars:
#   ADSTERRA_<ZONE>_SRC = full script URL (e.g. //pl12345.profitableratecpm.com/hash/invoke.js)
#   ADSTERRA_<ZONE>_ID  = container div id (e.g. container-hash)
# Zones: TOP, ARTICLE, BOTTOM, LEFT, RIGHT

AD_PROVIDER="none"
if [ -n "$ADSTERRA_TOP_SRC" ] || [ -n "$ADSTERRA_ARTICLE_SRC" ] || [ -n "$ADSTERRA_BOTTOM_SRC" ]; then
    AD_PROVIDER="adsterra"
fi

cat > js/ads-config.js << ADEOF
window.ADS_CONFIG = {
    provider: "${AD_PROVIDER}",
    adsterra: {
        top:       { src: "${ADSTERRA_TOP_SRC:-}", containerId: "${ADSTERRA_TOP_ID:-}" },
        inArticle: { src: "${ADSTERRA_ARTICLE_SRC:-}", containerId: "${ADSTERRA_ARTICLE_ID:-}" },
        bottom:    { src: "${ADSTERRA_BOTTOM_SRC:-}", containerId: "${ADSTERRA_BOTTOM_ID:-}" },
        left:      { src: "${ADSTERRA_LEFT_SRC:-}", containerId: "${ADSTERRA_LEFT_ID:-}" },
        right:     { src: "${ADSTERRA_RIGHT_SRC:-}", containerId: "${ADSTERRA_RIGHT_ID:-}" }
    }
};
ADEOF
echo "   ✓ Ads config gerado (provider: $AD_PROVIDER)"

find . -maxdepth 1 -name "*.bak" -delete 2>/dev/null || true

echo ">> Build concluído!"
