(function () {
    'use strict';

    const FIPE_API = 'https://fipe.parallelum.com.br/api/v2';

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

    // --- Analytics ---
    function trackEvent(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
        if (typeof clarity === 'function') {
            clarity('set', eventName, JSON.stringify(params || {}));
        }
    }

    // --- DOM ---
    const form = document.getElementById('ipva-form');
    const estadoSelect = document.getElementById('estado');
    const valorFipeInput = document.getElementById('valor-fipe');
    const valorFipeHidden = document.getElementById('valor-fipe-hidden');
    const pesoInput = document.getElementById('peso-veiculo');
    const aliquotaInfo = document.getElementById('aliquota-info');
    const resultsSection = document.getElementById('results');
    const btnRecalcular = document.getElementById('btn-recalcular');
    const btnCompartilhar = document.getElementById('btn-compartilhar');

    const fipeLookup = document.getElementById('fipe-lookup');
    const manualInput = document.getElementById('manual-input');
    const toggleManual = document.getElementById('fipe-toggle-manual');
    const toggleAuto = document.getElementById('fipe-toggle-auto');
    const fipeTipo = document.getElementById('fipe-tipo');
    const fipeMarca = document.getElementById('fipe-marca');
    const fipeModelo = document.getElementById('fipe-modelo');
    const fipeAno = document.getElementById('fipe-ano');
    const fipeResult = document.getElementById('fipe-result');
    const fipeValor = document.getElementById('fipe-valor');
    const fipeRef = document.getElementById('fipe-ref');

    var inputMode = 'fipe'; // 'fipe' or 'manual'

    // --- Toggle Input Modes ---
    toggleManual.addEventListener('click', function () {
        inputMode = 'manual';
        fipeLookup.classList.add('hidden');
        manualInput.classList.remove('hidden');
        valorFipeHidden.value = '0';
        trackEvent('input_mode_changed', { mode: 'manual' });
    });

    toggleAuto.addEventListener('click', function () {
        inputMode = 'fipe';
        manualInput.classList.add('hidden');
        fipeLookup.classList.remove('hidden');
        trackEvent('input_mode_changed', { mode: 'fipe' });
    });

    // --- Populate States ---
    function populateStates() {
        var sorted = Object.entries(ALIQUOTAS).sort(function (a, b) {
            return a[1].nome.localeCompare(b[1].nome, 'pt-BR');
        });

        sorted.forEach(function (entry) {
            var uf = entry[0];
            var data = entry[1];
            var option = document.createElement('option');
            option.value = uf;
            option.textContent = data.nome + ' (' + uf + ') — ' + data.aliquota + '%';
            estadoSelect.appendChild(option);
        });
    }

    // --- Currency ---
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        });
    }

    function parseCurrency(str) {
        if (!str) return 0;
        var cleaned = str.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }

    function parseFipePrice(str) {
        if (!str) return 0;
        return parseFloat(str.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
    }

    function applyCurrencyMask(input) {
        input.addEventListener('input', function () {
            var value = this.value.replace(/\D/g, '');
            if (!value) {
                this.value = '';
                return;
            }
            value = (parseInt(value, 10) / 100).toFixed(2);
            var parts = value.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            this.value = parts.join(',');
        });
    }

    // --- State Selection ---
    estadoSelect.addEventListener('change', function () {
        var uf = this.value;
        if (uf && ALIQUOTAS[uf]) {
            aliquotaInfo.textContent = 'Alíquota atual de ' + ALIQUOTAS[uf].nome + ': ' + ALIQUOTAS[uf].aliquota + '%';
            trackEvent('state_selected', { state: uf, rate: ALIQUOTAS[uf].aliquota });
        } else {
            aliquotaInfo.textContent = '';
        }
    });

    // =============================================
    // FIPE API Integration
    // =============================================

    function setSelectLoading(select, text) {
        select.innerHTML = '<option value="">' + (text || 'Carregando...') + '</option>';
        select.disabled = true;
    }

    function setSelectReady(select, placeholder) {
        select.innerHTML = '<option value="">' + placeholder + '</option>';
        select.disabled = false;
    }

    function populateSelect(select, items, placeholder) {
        select.innerHTML = '<option value="">' + placeholder + '</option>';
        items.forEach(function (item) {
            var opt = document.createElement('option');
            opt.value = item.code;
            opt.textContent = item.name;
            select.appendChild(opt);
        });
        select.disabled = false;
    }

    function resetDownstream(fromLevel) {
        if (fromLevel <= 1) {
            fipeModelo.innerHTML = '<option value="">Selecione a marca</option>';
            fipeModelo.disabled = true;
        }
        if (fromLevel <= 2) {
            fipeAno.innerHTML = '<option value="">Selecione o modelo</option>';
            fipeAno.disabled = true;
        }
        fipeResult.classList.add('hidden');
        valorFipeHidden.value = '0';
    }

    async function fetchFipe(path) {
        var response = await fetch(FIPE_API + path);
        if (!response.ok) throw new Error('FIPE API error: ' + response.status);
        return response.json();
    }

    // Load brands on tipo change (and on init)
    async function loadBrands() {
        var tipo = fipeTipo.value;
        setSelectLoading(fipeMarca, 'Carregando marcas...');
        resetDownstream(1);

        try {
            var brands = await fetchFipe('/' + tipo + '/brands');
            populateSelect(fipeMarca, brands, 'Selecione a marca');
            trackEvent('fipe_brands_loaded', { type: tipo, count: brands.length });
        } catch (e) {
            setSelectReady(fipeMarca, 'Erro ao carregar');
        }
    }

    // Load models on marca change
    async function loadModels() {
        var tipo = fipeTipo.value;
        var marcaId = fipeMarca.value;
        if (!marcaId) { resetDownstream(1); return; }

        setSelectLoading(fipeModelo, 'Carregando modelos...');
        resetDownstream(2);

        try {
            var models = await fetchFipe('/' + tipo + '/brands/' + marcaId + '/models');
            populateSelect(fipeModelo, models, 'Selecione o modelo');
            trackEvent('fipe_models_loaded', { brand: marcaId, count: models.length });
        } catch (e) {
            setSelectReady(fipeModelo, 'Erro ao carregar');
        }
    }

    // Load years on modelo change
    async function loadYears() {
        var tipo = fipeTipo.value;
        var marcaId = fipeMarca.value;
        var modeloId = fipeModelo.value;
        if (!modeloId) { resetDownstream(2); return; }

        setSelectLoading(fipeAno, 'Carregando anos...');
        fipeResult.classList.add('hidden');
        valorFipeHidden.value = '0';

        try {
            var years = await fetchFipe('/' + tipo + '/brands/' + marcaId + '/models/' + modeloId + '/years');
            populateSelect(fipeAno, years, 'Selecione o ano');
            trackEvent('fipe_years_loaded', { model: modeloId, count: years.length });
        } catch (e) {
            setSelectReady(fipeAno, 'Erro ao carregar');
        }
    }

    // Fetch price on ano change
    async function loadPrice() {
        var tipo = fipeTipo.value;
        var marcaId = fipeMarca.value;
        var modeloId = fipeModelo.value;
        var anoId = fipeAno.value;
        if (!anoId) {
            fipeResult.classList.add('hidden');
            valorFipeHidden.value = '0';
            return;
        }

        fipeResult.classList.remove('hidden');
        fipeValor.textContent = 'Consultando...';
        fipeRef.textContent = '';

        try {
            var data = await fetchFipe('/' + tipo + '/brands/' + marcaId + '/models/' + modeloId + '/years/' + anoId);
            var price = parseFipePrice(data.price);
            valorFipeHidden.value = price.toString();
            fipeValor.textContent = data.price;
            fipeRef.textContent = data.model + ' • ' + data.fuel + ' • Ref. ' + data.referenceMonth;
            trackEvent('fipe_price_loaded', {
                brand: data.brand,
                model: data.model,
                year: data.modelYear,
                price: price,
                fipe_code: data.codeFipe
            });
        } catch (e) {
            fipeValor.textContent = 'Erro na consulta';
            fipeRef.textContent = 'Tente novamente';
            valorFipeHidden.value = '0';
        }
    }

    fipeTipo.addEventListener('change', loadBrands);
    fipeMarca.addEventListener('change', loadModels);
    fipeModelo.addEventListener('change', loadYears);
    fipeAno.addEventListener('change', loadPrice);

    // --- Calculate ---
    function calculate(uf, valorFipe, peso) {
        var aliquotaAtual = ALIQUOTAS[uf].aliquota;
        var ipvaAtual = valorFipe * (aliquotaAtual / 100);
        var novaAliquota = NOVO_TETO;

        if (peso && peso > 0) {
            var fatorPeso = Math.max(0.3, Math.min(1.0, peso / 2000));
            novaAliquota = NOVO_TETO * fatorPeso;
            novaAliquota = Math.round(novaAliquota * 100) / 100;
        }

        var ipvaNovo = valorFipe * (novaAliquota / 100);
        var economiaAnual = ipvaAtual - ipvaNovo;
        var economia5Anos = economiaAnual * 5;
        var reducaoPercent = ((economiaAnual / ipvaAtual) * 100);

        return {
            uf: uf,
            estado: ALIQUOTAS[uf].nome,
            aliquotaAtual: aliquotaAtual,
            novaAliquota: novaAliquota,
            valorFipe: valorFipe,
            peso: peso,
            ipvaAtual: ipvaAtual,
            ipvaNovo: ipvaNovo,
            economiaAnual: economiaAnual,
            economia5Anos: economia5Anos,
            reducaoPercent: reducaoPercent
        };
    }

    function displayResults(result) {
        document.getElementById('results-state-info').textContent =
            result.estado + ' — Veículo avaliado em ' + formatCurrency(result.valorFipe) +
            (result.peso ? ' (' + result.peso + ' kg)' : '');

        document.getElementById('result-aliquota-atual').textContent =
            'Alíquota de ' + result.aliquotaAtual + '%';
        document.getElementById('result-valor-atual').textContent =
            formatCurrency(result.ipvaAtual);
        document.getElementById('result-valor-novo').textContent =
            formatCurrency(result.ipvaNovo);
        document.getElementById('economia-anual').textContent =
            formatCurrency(result.economiaAnual);
        document.getElementById('reducao-percent').textContent =
            result.reducaoPercent.toFixed(1) + '%';
        document.getElementById('economia-5anos').textContent =
            formatCurrency(result.economia5Anos);

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- Form Submit ---
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var uf = estadoSelect.value;
        var valorFipe;

        if (inputMode === 'fipe') {
            valorFipe = parseFloat(valorFipeHidden.value) || 0;
            if (valorFipe <= 0) {
                fipeMarca.focus();
                return;
            }
        } else {
            valorFipe = parseCurrency(valorFipeInput.value);
            if (valorFipe <= 0) {
                valorFipeInput.focus();
                return;
            }
        }

        var peso = parseInt(pesoInput.value, 10) || 0;

        if (!uf) {
            estadoSelect.focus();
            return;
        }

        var result = calculate(uf, valorFipe, peso);
        displayResults(result);

        trackEvent('calculation_performed', {
            input_mode: inputMode,
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
        var economiaEl = document.getElementById('economia-anual');
        var economia5El = document.getElementById('economia-5anos');

        var shareText = 'Calculei minha economia com a PEC do IPVA!\n' +
            'Economia anual: ' + economiaEl.textContent + '\n' +
            'Economia em 5 anos: ' + economia5El.textContent + '\n' +
            'Calcule a sua: https://ipva.fsncompany.com.br';

        if (navigator.share) {
            navigator.share({
                title: 'Calculadora do Novo IPVA',
                text: shareText,
                url: 'https://ipva.fsncompany.com.br'
            }).catch(function () {});
        } else {
            var btn = this;
            navigator.clipboard.writeText(shareText).then(function () {
                var orig = btn.textContent;
                btn.textContent = 'Copiado!';
                setTimeout(function () { btn.textContent = orig; }, 2000);
            }).catch(function () {});
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

    function getCookieConsent() { return localStorage.getItem('cookie_consent'); }

    function setCookieConsent(value) {
        localStorage.setItem('cookie_consent', value);
        localStorage.setItem('cookie_consent_date', new Date().toISOString());
    }

    function showCookieBanner() {
        if (!getCookieConsent()) cookieBanner.classList.remove('hidden');
    }

    function handleConsent(accepted) {
        setCookieConsent(accepted ? 'accepted' : 'rejected');
        cookieBanner.classList.add('hidden');
        trackEvent('cookie_consent', { accepted: accepted });
        if (accepted) { enablePersonalizedAds(); } else { disablePersonalizedAds(); }
    }

    function enablePersonalizedAds() {
        if (typeof adsbygoogle !== 'undefined') adsbygoogle.requestNonPersonalizedAds = 0;
    }

    function disablePersonalizedAds() {
        if (typeof adsbygoogle !== 'undefined') adsbygoogle.requestNonPersonalizedAds = 1;
    }

    if (btnAccept) btnAccept.addEventListener('click', function () { handleConsent(true); });
    if (btnReject) btnReject.addEventListener('click', function () { handleConsent(false); });

    if (getCookieConsent() === 'rejected') disablePersonalizedAds();

    // --- Track Page View ---
    trackEvent('page_view', { page_title: document.title, timestamp: new Date().toISOString() });

    // --- Init ---
    populateStates();
    if (valorFipeInput) applyCurrencyMask(valorFipeInput);
    showCookieBanner();
    loadBrands();

})();
