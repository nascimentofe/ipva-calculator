#!/bin/bash
# Build script - substitui placeholders pelas Environment Variables do Render

set -e

echo ">> Iniciando build..."

if [ -n "$GA_MEASUREMENT_ID" ]; then
    sed -i.bak "s/G-XXXXXXXXXX/$GA_MEASUREMENT_ID/g" index.html
    echo "   ✓ Google Analytics: $GA_MEASUREMENT_ID"
else
    echo "   ⚠ GA_MEASUREMENT_ID não definida (analytics desativado)"
fi

if [ -n "$CLARITY_ID" ]; then
    sed -i.bak "s/CLARITY_ID/$CLARITY_ID/g" index.html
    echo "   ✓ Microsoft Clarity: $CLARITY_ID"
else
    echo "   ⚠ CLARITY_ID não definida (clarity desativado)"
fi

if [ -n "$ADSENSE_PUB_ID" ]; then
    sed -i.bak "s/ca-pub-XXXXXXXXXXXXXXXX/$ADSENSE_PUB_ID/g" index.html
    PUB_NUMBER="${ADSENSE_PUB_ID#ca-}"
    sed -i.bak "s/pub-XXXXXXXXXXXXXXXX/$PUB_NUMBER/g" ads.txt
    echo "   ✓ AdSense Publisher: $ADSENSE_PUB_ID"
else
    echo "   ⚠ ADSENSE_PUB_ID não definida (ads desativados)"
fi

if [ -n "$AD_SLOT_TOP" ]; then
    sed -i.bak "s/TOP_AD_SLOT_ID/$AD_SLOT_TOP/g" index.html
    echo "   ✓ Ad Slot Top: $AD_SLOT_TOP"
fi

if [ -n "$AD_SLOT_LEFT" ]; then
    sed -i.bak "s/LEFT_AD_SLOT_ID/$AD_SLOT_LEFT/g" index.html
    echo "   ✓ Ad Slot Left: $AD_SLOT_LEFT"
fi

if [ -n "$AD_SLOT_RIGHT" ]; then
    sed -i.bak "s/RIGHT_AD_SLOT_ID/$AD_SLOT_RIGHT/g" index.html
    echo "   ✓ Ad Slot Right: $AD_SLOT_RIGHT"
fi

if [ -n "$AD_SLOT_IN_ARTICLE" ]; then
    sed -i.bak "s/IN_ARTICLE_AD_SLOT_ID/$AD_SLOT_IN_ARTICLE/g" index.html
    echo "   ✓ Ad Slot In-Article: $AD_SLOT_IN_ARTICLE"
fi

if [ -n "$AD_SLOT_BOTTOM" ]; then
    sed -i.bak "s/BOTTOM_AD_SLOT_ID/$AD_SLOT_BOTTOM/g" index.html
    echo "   ✓ Ad Slot Bottom: $AD_SLOT_BOTTOM"
fi

rm -f *.bak

echo ">> Build concluído!"
