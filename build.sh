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

if [ -n "$AD_SLOT_TOP" ]; then
    sed -i.bak "s/TOP_AD_SLOT_ID/$AD_SLOT_TOP/g" "$HTML"
    echo "   ✓ Ad Slot Top: $AD_SLOT_TOP"
fi

if [ -n "$AD_SLOT_LEFT" ]; then
    sed -i.bak "s/LEFT_AD_SLOT_ID/$AD_SLOT_LEFT/g" "$HTML"
    echo "   ✓ Ad Slot Left: $AD_SLOT_LEFT"
fi

if [ -n "$AD_SLOT_RIGHT" ]; then
    sed -i.bak "s/RIGHT_AD_SLOT_ID/$AD_SLOT_RIGHT/g" "$HTML"
    echo "   ✓ Ad Slot Right: $AD_SLOT_RIGHT"
fi

if [ -n "$AD_SLOT_IN_ARTICLE" ]; then
    sed -i.bak "s/IN_ARTICLE_AD_SLOT_ID/$AD_SLOT_IN_ARTICLE/g" "$HTML"
    echo "   ✓ Ad Slot In-Article: $AD_SLOT_IN_ARTICLE"
fi

if [ -n "$AD_SLOT_BOTTOM" ]; then
    sed -i.bak "s/BOTTOM_AD_SLOT_ID/$AD_SLOT_BOTTOM/g" "$HTML"
    echo "   ✓ Ad Slot Bottom: $AD_SLOT_BOTTOM"
fi

find . -maxdepth 1 -name "*.bak" -delete 2>/dev/null || true

echo ">> Build concluído!"
