(function () {
    'use strict';

    const ALIQUOTAS = {
        AC: { nome: 'Acre', aliquota: 2.0 },
        AL: { nome: 'Alagoas', aliquota: 3.0 },
        AM: { nome: 'Amazonas', aliquota: 3.0 },
        AP: { nome: 'Amapá', aliquota: 3.0 },
        BA: { nome: 'Bahia', aliquota: 2.5 },
        CE: { nome: 'Ceará', aliquota: 2.5 },
        DF: { nome: 'Distrito Federal', aliquota: 3.5 },
        ES: { nome: 'Espírito Santo', aliquota: 2.0 },
        GO: { nome: 'Goiás', aliquota: 3.75 },
        MA: { nome: 'Maranhão', aliquota: 2.5 },
        MG: { nome: 'Minas Gerais', aliquota: 4.0 },
        MS: { nome: 'Mato Grosso do Sul', aliquota: 3.0 },
        MT: { nome: 'Mato Grosso', aliquota: 3.0 },
        PA: { nome: 'Pará', aliquota: 2.5 },
        PB: { nome: 'Paraíba', aliquota: 2.5 },
        PE: { nome: 'Pernambuco', aliquota: 3.0 },
        PI: { nome: 'Piauí', aliquota: 2.5 },
        PR: { nome: 'Paraná', aliquota: 3.5 },
        RJ: { nome: 'Rio de Janeiro', aliquota: 4.0 },
        RN: { nome: 'Rio Grande do Norte', aliquota: 3.0 },
        RO: { nome: 'Rondônia', aliquota: 3.0 },
        RR: { nome: 'Roraima', aliquota: 3.0 },
        RS: { nome: 'Rio Grande do Sul', aliquota: 3.0 },
        SC: { nome: 'Santa Catarina', aliquota: 2.0 },
        SE: { nome: 'Sergipe', aliquota: 2.5 },
        SP: { nome: 'São Paulo', aliquota: 4.0 },
        TO: { nome: 'Tocantins', aliquota: 2.0 }
    };

    const NOVO_TETO = 1.0;

    // --- Analytics Helpers ---
    function trackEvent(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
        if (typeof clarity === 'function') {
            clarity('set', eventName, JSON.stringify(params || {}));
        }
        console.log('[Analytics]', eventName, params);
    }

    // --- DOM Elements ---
    const form = document.getElementById('ipva-form');
    const estadoSelect = document.getElementById('estado');
    const valorFipeInput = document.getElementById('valor-fipe');
    const pesoInput = document.getElementById('peso-veiculo');
    const aliquotaInfo = document.getElementById('aliquota-info');
    const resultsSection = document.getElementById('results');
    const btnRecalcular = document.getElementById('btn-recalcular');
    const btnCompartilhar = document.getElementById('btn-compartilhar');

    // --- Populate States ---
    function populateStates() {
        const sorted = Object.entries(ALIQUOTAS).sort((a, b) =>
            a[1].nome.localeCompare(b[1].nome, 'pt-BR')
        );

        sorted.forEach(([uf, data]) => {
            const option = document.createElement('option');
            option.value = uf;
            option.textContent = `${data.nome} (${uf}) — ${data.aliquota}%`;
            estadoSelect.appendChild(option);
        });
    }

    // --- Currency Formatting ---
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        });
    }

    function parseCurrency(str) {
        if (!str) return 0;
        const cleaned = str.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }

    // --- Currency Input Mask ---
    function applyCurrencyMask(input) {
        input.addEventListener('input', function () {
            let value = this.value.replace(/\D/g, '');
            if (!value) {
                this.value = '';
                return;
            }

            value = (parseInt(value, 10) / 100).toFixed(2);
            const parts = value.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            this.value = parts.join(',');
        });
    }

    // --- State Selection ---
    estadoSelect.addEventListener('change', function () {
        const uf = this.value;
        if (uf && ALIQUOTAS[uf]) {
            aliquotaInfo.textContent = `Alíquota atual de ${ALIQUOTAS[uf].nome}: ${ALIQUOTAS[uf].aliquota}%`;
            trackEvent('state_selected', { state: uf, rate: ALIQUOTAS[uf].aliquota });
        } else {
            aliquotaInfo.textContent = '';
        }
    });

    // --- Calculate ---
    function calculate(uf, valorFipe, peso) {
        const aliquotaAtual = ALIQUOTAS[uf].aliquota;
        const ipvaAtual = valorFipe * (aliquotaAtual / 100);

        let novaAliquota = NOVO_TETO;

        if (peso && peso > 0) {
            const fatorPeso = Math.max(0.3, Math.min(1.0, peso / 2000));
            novaAliquota = NOVO_TETO * fatorPeso;
            novaAliquota = Math.round(novaAliquota * 100) / 100;
        }

        const ipvaNovo = valorFipe * (novaAliquota / 100);
        const economiaAnual = ipvaAtual - ipvaNovo;
        const economia5Anos = economiaAnual * 5;
        const reducaoPercent = ((economiaAnual / ipvaAtual) * 100);

        return {
            uf,
            estado: ALIQUOTAS[uf].nome,
            aliquotaAtual,
            novaAliquota,
            valorFipe,
            peso,
            ipvaAtual,
            ipvaNovo,
            economiaAnual,
            economia5Anos,
            reducaoPercent
        };
    }

    // --- Display Results ---
    function displayResults(result) {
        document.getElementById('results-state-info').textContent =
            `${result.estado} — Veículo avaliado em ${formatCurrency(result.valorFipe)}` +
            (result.peso ? ` (${result.peso} kg)` : '');

        document.getElementById('result-aliquota-atual').textContent =
            `Alíquota de ${result.aliquotaAtual}%`;

        document.getElementById('result-valor-atual').textContent =
            formatCurrency(result.ipvaAtual);

        document.getElementById('result-valor-novo').textContent =
            formatCurrency(result.ipvaNovo);

        document.getElementById('economia-anual').textContent =
            formatCurrency(result.economiaAnual);

        document.getElementById('reducao-percent').textContent =
            `${result.reducaoPercent.toFixed(1)}%`;

        document.getElementById('economia-5anos').textContent =
            formatCurrency(result.economia5Anos);

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- Form Submit ---
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const uf = estadoSelect.value;
        const valorFipe = parseCurrency(valorFipeInput.value);
        const peso = parseInt(pesoInput.value, 10) || 0;

        if (!uf) {
            estadoSelect.focus();
            return;
        }

        if (valorFipe <= 0) {
            valorFipeInput.focus();
            return;
        }

        const result = calculate(uf, valorFipe, peso);
        displayResults(result);

        trackEvent('calculation_performed', {
            state: uf,
            vehicle_value: valorFipe,
            vehicle_weight: peso,
            current_ipva: result.ipvaAtual,
            new_ipva: result.ipvaNovo,
            annual_savings: result.economiaAnual
        });
    });

    // --- Recalculate ---
    btnRecalcular.addEventListener('click', function () {
        resultsSection.classList.add('hidden');
        document.getElementById('calculadora').scrollIntoView({ behavior: 'smooth' });
        trackEvent('recalculate_clicked', {});
    });

    // --- Share ---
    btnCompartilhar.addEventListener('click', function () {
        const economiaEl = document.getElementById('economia-anual');
        const economia5El = document.getElementById('economia-5anos');

        const shareText = `Calculei minha economia com a PEC do IPVA!\n` +
            `Economia anual: ${economiaEl.textContent}\n` +
            `Economia em 5 anos: ${economia5El.textContent}\n` +
            `Calcule a sua: https://ipva.fsncompany.com.br`;

        if (navigator.share) {
            navigator.share({
                title: 'Calculadora do Novo IPVA',
                text: shareText,
                url: 'https://ipva.fsncompany.com.br'
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                const originalText = this.textContent;
                this.textContent = 'Copiado!';
                setTimeout(() => { this.textContent = originalText; }, 2000);
            }).catch(() => {});
        }

        trackEvent('share_clicked', { method: navigator.share ? 'native' : 'clipboard' });
    });

    // --- FAQ Tracking ---
    document.querySelectorAll('.faq-item summary').forEach(function (summary) {
        summary.addEventListener('click', function () {
            trackEvent('faq_opened', { question: this.textContent.trim() });
        });
    });

    // --- Cookie Consent (LGPD) ---
    var cookieBanner = document.getElementById('cookie-consent');
    var btnAccept = document.getElementById('cookie-accept');
    var btnReject = document.getElementById('cookie-reject');

    function getCookieConsent() {
        return localStorage.getItem('cookie_consent');
    }

    function setCookieConsent(value) {
        localStorage.setItem('cookie_consent', value);
        localStorage.setItem('cookie_consent_date', new Date().toISOString());
    }

    function showCookieBanner() {
        if (!getCookieConsent()) {
            cookieBanner.classList.remove('hidden');
        }
    }

    function handleConsent(accepted) {
        setCookieConsent(accepted ? 'accepted' : 'rejected');
        cookieBanner.classList.add('hidden');
        trackEvent('cookie_consent', { accepted: accepted });

        if (accepted) {
            enablePersonalizedAds();
        } else {
            disablePersonalizedAds();
        }
    }

    function enablePersonalizedAds() {
        if (typeof adsbygoogle !== 'undefined') {
            adsbygoogle.requestNonPersonalizedAds = 0;
        }
    }

    function disablePersonalizedAds() {
        if (typeof adsbygoogle !== 'undefined') {
            adsbygoogle.requestNonPersonalizedAds = 1;
        }
    }

    if (btnAccept) {
        btnAccept.addEventListener('click', function () { handleConsent(true); });
    }
    if (btnReject) {
        btnReject.addEventListener('click', function () { handleConsent(false); });
    }

    var consent = getCookieConsent();
    if (consent === 'rejected') {
        disablePersonalizedAds();
    }

    // --- Track Page View ---
    trackEvent('page_view', {
        page_title: document.title,
        timestamp: new Date().toISOString()
    });

    // --- Init ---
    populateStates();
    applyCurrencyMask(valorFipeInput);
    showCookieBanner();

})();
