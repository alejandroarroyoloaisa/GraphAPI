// Clase para manejar los resultados
class ResultsManager {
    constructor() {
        // Inicializar inmediatamente si el DOM está listo
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.initialize();
        } else {
            // Esperar a que el DOM esté listo
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        }
    }

    initialize() {
        // Verificar que el modal existe antes de continuar
        const modal = document.getElementById('resultsModal');
        if (!modal) {
            console.warn('Modal de resultados no encontrado. Reintentando en 100ms...');
            setTimeout(() => this.initialize(), 100);
            return;
        }

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        try {
            // Elementos del modal
            this.modal = document.getElementById('resultsModal');
            if (!this.modal) {
                throw new Error('Modal no encontrado');
            }
            this.modalContent = this.modal.querySelector('.results-content');
            this.closeButton = document.getElementById('closeResults');

            // Secciones del modal
            this.generalInfo = document.getElementById('generalInfo');
            this.nodesList = document.getElementById('nodesList');
            this.edgesList = document.getElementById('edgesList');
            this.metricsNotification = document.getElementById('metricsNotification');

            // Contenido de las secciones
            this.nodesListContent = document.getElementById('nodesListContent');
            this.edgesListContent = document.getElementById('edgesListContent');

            // Elementos de información general
            this.numNodosElement = document.getElementById('numNodos');
            this.numAristasElement = document.getElementById('numAristas');

            // Elementos de métricas
            this.centralidadResults = document.getElementById('centralidadResults');
            this.cercaniaResults = document.getElementById('cercaniaResults');
            this.intermediacionResults = document.getElementById('intermediacionResults');
            this.pagerankResults = document.getElementById('pagerankResults');
            this.hitsResults = document.getElementById('hitsResults');

            // Elementos de detalles del nodo
            this.nodeNameElement = document.getElementById('nodeName');
            this.nodeCentralidadElement = document.getElementById('nodeCentralidad');
            this.nodeCercaniaElement = document.getElementById('nodeCercania');
            this.nodeIntermediacionElement = document.getElementById('nodeIntermediacion');
            this.nodePagerankElement = document.getElementById('nodePagerank');
            this.nodeAuthorityElement = document.getElementById('nodeAuthority');
            this.nodeHubElement = document.getElementById('nodeHub');

            // Botones de acción
            this.exportButton = document.getElementById('exportResults');
            this.clearButton = document.getElementById('clearResults');

            // Verificar que todos los elementos necesarios existen
            this.verifyElements();
        } catch (error) {
            console.error('Error al inicializar elementos:', error);
            // Reintentar la inicialización después de un breve retraso
            setTimeout(() => this.initialize(), 100);
        }
    }

    verifyElements() {
        const requiredElements = [
            'resultsModal', 'closeResults',
            'generalInfo', 'nodesList', 'edgesList', 'metricsNotification',
            'nodesListContent', 'edgesListContent',
            'numNodos', 'numAristas',
            'centralidadResults', 'cercaniaResults', 'intermediacionResults',
            'pagerankResults', 'hitsResults',
            'nodeName', 'nodeCentralidad', 'nodeCercania',
            'nodeIntermediacion', 'nodePagerank', 'nodeAuthority', 'nodeHub',
            'exportResults', 'clearResults'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('Elementos faltantes en el componente de resultados:', missingElements);
            // Reintentar la inicialización después de un breve retraso
            setTimeout(() => this.initialize(), 100);
        }
    }

    attachEventListeners() {
        // Eventos del modal
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hideModal());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        }

        // Eventos de los botones de acción
        if (this.exportButton) {
            this.exportButton.addEventListener('click', () => this.exportResults());
        }
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.clearResults());
        }

        // Evento para cerrar con la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.hideModal();
            }
        });
    }

    // Mostrar el modal
    showModal() {
        if (this.modal && this.modalContent) {
            this.modal.classList.add('show');
            this.modalContent.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevenir scroll del body
        }
    }

    // Ocultar el modal
    hideModal() {
        if (this.modal && this.modalContent) {
            this.modal.classList.remove('show');
            this.modalContent.classList.remove('show');
            document.body.style.overflow = ''; // Restaurar scroll del body
        }
    }

    // Mostrar información general (número de nodos y aristas)
    showGeneralInfo(data) {
        this.hideAllSections();
        this.generalInfo.classList.add('active');
        
        if (this.numNodosElement) this.numNodosElement.textContent = data.num_nodos;
        if (this.numAristasElement) this.numAristasElement.textContent = data.num_aristas;
        
        this.showModal();
    }

    // Mostrar lista de nodos
    showNodesList(nodes) {
        this.hideAllSections();
        this.nodesList.classList.add('active');
        
        if (this.nodesListContent) {
            this.nodesListContent.innerHTML = nodes.map(node => `
                <div class="node-item">
                    <h4>${node.label || node.nombre}</h4>
                    ${this.formatNodeMetrics(node)}
                </div>
            `).join('');
        }
        
        this.showModal();
    }

    // Mostrar lista de aristas
    showEdgesList(edges) {
        this.hideAllSections();
        this.edgesList.classList.add('active');
        
        if (this.edgesListContent) {
            if (!edges || edges.length === 0) {
                this.edgesListContent.innerHTML = '<p class="no-data">No hay aristas disponibles</p>';
            } else {
                this.edgesListContent.innerHTML = edges.map(edge => `
                    <div class="edge-item">
                        <h4>${edge.nodo_origen_label || edge.nodo_origen}</h4>
                        <p>Conectado con: ${Array.isArray(edge.nodos_destino) 
                            ? edge.nodos_destino.map(nodo => nodo.label || nodo).join(', ') 
                            : edge.nodos_destino}</p>
                    </div>
                `).join('');
            }
        }
        
        this.showModal();
    }

    // Mostrar notificación de métricas calculadas
    showMetricsNotification(metricas) {
        this.hideAllSections();
        this.metricsNotification.classList.add('active');
        
        const successMessage = this.metricsNotification.querySelector('.success-message');
        if (successMessage) {
            successMessage.innerHTML = `
                <span class="success-icon">✓</span>
                <div>
                    <p>Las siguientes métricas han sido calculadas exitosamente:</p>
                    <ul class="metricas-list">
                        ${metricas.map(metrica => `<li>${metrica}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    hideAllSections() {
        [this.generalInfo, this.nodesList, this.edgesList, this.metricsNotification]
            .forEach(section => section?.classList.remove('active'));
    }

    formatNodeMetrics(node) {
        const metrics = [];
        if (node.centralidad !== undefined) metrics.push(`Centralidad: ${this.formatNumber(node.centralidad)}`);
        if (node.cercania !== undefined) metrics.push(`Cercanía: ${this.formatNumber(node.cercania)}`);
        if (node.intermediacion !== undefined) metrics.push(`Intermediación: ${this.formatNumber(node.intermediacion)}`);
        if (node.pagerank !== undefined) metrics.push(`PageRank: ${this.formatNumber(node.pagerank)}`);
        if (node.authority !== undefined) metrics.push(`Authority: ${this.formatNumber(node.authority)}`);
        if (node.hub !== undefined) metrics.push(`Hub: ${this.formatNumber(node.hub)}`);

        return metrics.length > 0 
            ? `<div class="node-metrics">${metrics.join('<br>')}</div>`
            : '';
    }

    // Actualizar métricas
    updateMetrics(data) {
        if (!data) return;

        // Actualizar centralidad
        if (this.centralidadResults) {
            this.updateMetricCard(this.centralidadResults, data.centralidad);
        }
        
        // Actualizar cercanía
        if (this.cercaniaResults) {
            this.updateMetricCard(this.cercaniaResults, data.cercania);
        }
        
        // Actualizar intermediación
        if (this.intermediacionResults) {
            this.updateMetricCard(this.intermediacionResults, data.intermediacion);
        }
        
        // Actualizar PageRank
        if (this.pagerankResults) {
            this.updateMetricCard(this.pagerankResults, data.pagerank);
        }
        
        // Actualizar HITS
        if (this.hitsResults) {
            this.updateMetricCard(this.hitsResults, data.hits);
        }

        this.showModal(); // Mostrar el modal al actualizar métricas
    }

    // Actualizar detalles de un nodo específico
    updateNodeDetails(nodeData) {
        if (!nodeData) return;

        if (this.nodeNameElement) this.nodeNameElement.textContent = nodeData.nombre;
        if (this.nodeCentralidadElement) this.nodeCentralidadElement.textContent = this.formatNumber(nodeData.centralidad);
        if (this.nodeCercaniaElement) this.nodeCercaniaElement.textContent = this.formatNumber(nodeData.cercania);
        if (this.nodeIntermediacionElement) this.nodeIntermediacionElement.textContent = this.formatNumber(nodeData.intermediacion);
        if (this.nodePagerankElement) this.nodePagerankElement.textContent = this.formatNumber(nodeData.pagerank);
        if (this.nodeAuthorityElement) this.nodeAuthorityElement.textContent = this.formatNumber(nodeData.authority);
        if (this.nodeHubElement) this.nodeHubElement.textContent = this.formatNumber(nodeData.hub);

        this.showModal(); // Mostrar el modal al actualizar detalles del nodo
    }

    // Actualizar una tarjeta de métrica específica
    updateMetricCard(element, data) {
        if (!element || !data || !Array.isArray(data)) return;

        const sortedData = [...data].sort((a, b) => b.value - a.value);
        const top5 = sortedData.slice(0, 5);

        element.innerHTML = `
            <div class="metric-list">
                ${top5.map(item => `
                    <div class="metric-item">
                        <span class="node-name">${item.nombre}</span>
                        <span class="metric-value">${this.formatNumber(item.value)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Formatear números para mejor visualización
    formatNumber(num) {
        return Number(num).toFixed(4);
    }

    // Exportar resultados
    exportResults() {
        const activeSection = this.modal.querySelector('.results-section.active');
        if (!activeSection) return;

        let data = {};
        if (activeSection === this.generalInfo) {
            data = {
                numNodos: this.numNodosElement.textContent,
                numAristas: this.numAristasElement.textContent
            };
        } else if (activeSection === this.nodesList) {
            data = Array.from(this.nodesListContent.children).map(item => ({
                nombre: item.querySelector('h4').textContent,
                metrics: item.querySelector('.node-metrics')?.textContent
            }));
        } else if (activeSection === this.edgesList) {
            data = Array.from(this.edgesListContent.children).map(item => ({
                nodo_origen: item.querySelector('h4').textContent,
                nodos_destino: item.querySelector('p').textContent.replace('Conectado con: ', '').split(', ')
            }));
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultados-analisis.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Limpiar resultados
    clearResults() {
        this.hideAllSections();
        if (this.numNodosElement) this.numNodosElement.textContent = '-';
        if (this.numAristasElement) this.numAristasElement.textContent = '-';
        if (this.nodesListContent) this.nodesListContent.innerHTML = '';
        if (this.edgesListContent) this.edgesListContent.innerHTML = '';
        if (this.centralidadResults) this.centralidadResults.innerHTML = '';
        if (this.cercaniaResults) this.cercaniaResults.innerHTML = '';
        if (this.intermediacionResults) this.intermediacionResults.innerHTML = '';
        if (this.pagerankResults) this.pagerankResults.innerHTML = '';
        if (this.hitsResults) this.hitsResults.innerHTML = '';
        if (this.nodeNameElement) this.nodeNameElement.textContent = '-';
        if (this.nodeCentralidadElement) this.nodeCentralidadElement.textContent = '-';
        if (this.nodeCercaniaElement) this.nodeCercaniaElement.textContent = '-';
        if (this.nodeIntermediacionElement) this.nodeIntermediacionElement.textContent = '-';
        if (this.nodePagerankElement) this.nodePagerankElement.textContent = '-';
        if (this.nodeAuthorityElement) this.nodeAuthorityElement.textContent = '-';
        if (this.nodeHubElement) this.nodeHubElement.textContent = '-';
        this.hideModal();
    }
}

// Inicializar el gestor de resultados cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.resultsManager = new ResultsManager();
}); 