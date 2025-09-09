console.log("script.js: Script loaded.");

// Funciones para el modal
function mostrarModal() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('modal-resultados').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('modal-resultados').style.display = 'none';
}

// Función para mostrar resultados con formato mejorado
function mostrarResultados(data) {
    // Si hay un mensaje de éxito, mostrarlo como notificación
    if (data.mensaje) {
        mostrarNotificacion(data.mensaje, 'success');
    }

    // Actualizar el componente de resultados
    if (window.resultsManager) {
        // Actualizar información general
        if (data.num_nodos !== undefined && data.num_aristas !== undefined) {
            window.resultsManager.showGeneralInfo(data);
        }

        // Actualizar lista de nodos
        if (data.nodos) {
            window.resultsManager.showNodesList(data.nodos);
        }

        // Actualizar lista de aristas
        if (data.aristas) {
            window.resultsManager.showEdgesList(data.aristas);
        }
    }
}

// Función para mostrar errores con formato mejorado
function mostrarError(mensaje) {
    mostrarNotificacion(mensaje, 'error');
}

// Función para mostrar notificaciones tipo toast
function mostrarNotificacion(mensaje, tipo = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    
    // Crear el elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    // Título según el tipo
    let titulo = tipo === 'success' ? 'Éxito' : 
                 tipo === 'error' ? 'Error' : 'Información';
    
    // Icono según el tipo
    let icono = tipo === 'success' ? '✅' : 
               tipo === 'error' ? '❌' : 'ℹ️';
    
    // Contenido del toast
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${icono} ${titulo}</strong>
            <button type="button" class="btn-close" aria-label="Cerrar" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <div class="toast-body">
            ${mensaje}
        </div>
    `;
    
    // Añadir al contenedor
    toastContainer.appendChild(toast);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Variables globales para el autocompletado
let nodeNames = [];
let nodeMap = {};

// Función para inicializar el autocompletado
function initializeAutocomplete() {
    console.log("Inicializando autocompletado...");
    fetch('/nodos')
    .then(response => {
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('No hay grafo cargado. Por favor, cargue un grafo primero.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.error) {
            nodeNames = data.nodos.map(node => node.nombre);
            nodeMap = data.nodos.reduce((acc, node) => {
                acc[node.nombre] = node.id;
                return acc;
            }, {});
            console.log("Autocompletado inicializado con", nodeNames.length, "nodos");
        } else {
            console.error("Error al cargar nodos:", data.error);
            mostrarError(data.error);
        }
    })
    .catch(error => {
        console.error('Error al cargar nombres de nodos:', error);
        // No mostrar error al usuario si no hay grafo cargado
        if (!error.message.includes('No hay grafo cargado')) {
            mostrarError(error.message);
        }
    });
}

// Función para mostrar sugerencias
function showSuggestions(input, suggestionsContainer) {
    const value = input.value.toLowerCase();
    const suggestions = nodeNames.filter(name => 
        name.toLowerCase().includes(value)
    );

    suggestionsContainer.innerHTML = '';
    
    if (suggestions.length > 0) {
        suggestions.forEach(name => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = name;
            div.onclick = () => {
                input.value = name;
                suggestionsContainer.classList.remove('show');
                // Disparar evento de cambio para asegurar que se actualiza el valor
                input.dispatchEvent(new Event('change'));
            };
            suggestionsContainer.appendChild(div);
        });
        suggestionsContainer.classList.add('show');
    } else {
        suggestionsContainer.classList.remove('show');
    }
}

// Función para crear y mostrar el modal de información de nodo
function showNodeInfoModal(nodeData) {
    let modal = document.getElementById('nodeInfoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nodeInfoModal';
        modal.className = 'node-info-modal';
        document.body.appendChild(modal);
    }

    const formatNumber = (value) => {
        return (value !== null && value !== undefined) ? parseFloat(value).toFixed(3) : '0.000';
    };

    // Obtener los labels de los nodos adyacentes
    const adyacentesLabels = nodeData.adyacentes.map(ady => {
        // Si el adyacente es un objeto con label, usar el label
        if (ady && typeof ady === 'object' && 'label' in ady) {
            return ady.label;
        }
        // Si es un string (ID), buscar el label en nodeMap
        if (typeof ady === 'string') {
            // Buscar el nodo en nodeNames que corresponda a este ID
            const nodo = Object.entries(nodeMap).find(([_, id]) => id === ady);
            return nodo ? nodo[0] : ady; // Si no se encuentra, usar el ID como fallback
        }
        return ady; // Fallback para cualquier otro caso
    });

    modal.innerHTML = `
        <div class="node-info-header">
            <h4>Información del Nodo</h4>
            <button class="node-info-close">&times;</button>
        </div>
        <div class="node-info-content">
            <div class="node-metric">
                <span class="node-metric-label">Nombre:</span>
                <span class="node-metric-value">${nodeData.label || nodeData.nombre}</span>
            </div>
            <div class="node-metric">
                <span class="node-metric-label">ID:</span>
                <span class="node-metric-value">${nodeData.id}</span>
            </div>
            ${nodeData.centralidad !== undefined ? `
                <div class="node-metric">
                    <span class="node-metric-label">Centralidad:</span>
                    <span class="node-metric-value">${formatNumber(nodeData.centralidad)}</span>
                </div>
            ` : ''}
            ${nodeData.cercania !== undefined ? `
                <div class="node-metric">
                    <span class="node-metric-label">Cercanía:</span>
                    <span class="node-metric-value">${formatNumber(nodeData.cercania)}</span>
                </div>
            ` : ''}
            ${nodeData.intermediacion !== undefined ? `
                <div class="node-metric">
                    <span class="node-metric-label">Intermediación:</span>
                    <span class="node-metric-value">${formatNumber(nodeData.intermediacion)}</span>
                </div>
            ` : ''}
            ${nodeData.pagerank !== undefined ? `
                <div class="node-metric">
                    <span class="node-metric-label">PageRank:</span>
                    <span class="node-metric-value">${formatNumber(nodeData.pagerank)}</span>
                </div>
            ` : ''}
            ${nodeData.authority !== undefined ? `
                <div class="node-metric">
                    <span class="node-metric-label">Authority:</span>
                    <span class="node-metric-value">${formatNumber(nodeData.authority)}</span>
                </div>
            ` : ''}
            ${nodeData.hub !== undefined ? `
                <div class="node-metric">
                    <span class="node-metric-label">Hub:</span>
                    <span class="node-metric-value">${formatNumber(nodeData.hub)}</span>
                </div>
            ` : ''}
            <div class="node-adjacents">
                <h5>Nodos Adyacentes</h5>
                <ul class="node-adjacents-list">
                    ${adyacentesLabels.map(label => `<li>${label}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    modal.classList.add('show');

    // Event listeners para cerrar el modal
    modal.querySelector('.node-info-close').onclick = () => {
        modal.classList.remove('show');
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    };
}

// Función para crear y mostrar el modal de distancia
function showDistanceModal(data) {
    let modal = document.getElementById('distanceModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'distanceModal';
        modal.className = 'node-info-modal';
        document.body.appendChild(modal);
    }

    // Obtener los nombres de los nodos usando nodeMap
    const nodo1Nombre = Object.entries(nodeMap).find(([_, id]) => id === data.nodo1.id)?.[0] || data.nodo1.nombre;
    const nodo2Nombre = Object.entries(nodeMap).find(([_, id]) => id === data.nodo2.id)?.[0] || data.nodo2.nombre;

    modal.innerHTML = `
        <div class="node-info-header">
            <h4>Distancia entre Nodos</h4>
            <button class="node-info-close">&times;</button>
        </div>
        <div class="node-info-content">
            <div class="distance-result">
                <p>La distancia entre <strong>${nodo1Nombre}</strong> y <strong>${nodo2Nombre}</strong> es de ${data.distancia === 'infinito' ? '∞' : data.distancia} unidades.</p>
            </div>
        </div>
    `;

    modal.classList.add('show');

    // Event listeners para cerrar el modal
    modal.querySelector('.node-info-close').onclick = () => {
        modal.classList.remove('show');
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    };
}

// Modificar la función buscarNodo
function buscarNodo() {
    console.log("Buscando nodo...");
    const nombre = document.getElementById('buscarNodoInput').value.trim();
    if (!nombre) {
        mostrarError('Por favor, ingrese un nombre de nodo para buscar.');
        return;
    }

    // Verificar si hay nodos cargados
    if (nodeNames.length === 0) {
        mostrarError('No hay grafo cargado. Por favor, cargue un grafo primero.');
        return;
    }

    const id = nodeMap[nombre];
    console.log("ID encontrado para", nombre, ":", id);
    
    if (!id) {
        mostrarError('No se encontró el nodo especificado.');
        return;
    }

    fetch(`/nodo/${encodeURIComponent(id)}`)
    .then(response => {
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('No hay grafo cargado. Por favor, cargue un grafo primero.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
        } else {
            showNodeInfoModal(data);
        }
    })
    .catch(error => {
        console.error("Error al buscar nodo:", error);
        mostrarError(error.message);
    });
}

// Modificar la función calcularDistancia
function calcularDistancia() {
    console.log("Calculando distancia...");
    const nombre1 = document.getElementById('nodoId1').value.trim();
    const nombre2 = document.getElementById('nodoId2').value.trim();
    
    if (!nombre1 || !nombre2) {
        mostrarError('Por favor, ingrese los nombres de ambos nodos.');
        return;
    }

    // Verificar si hay nodos cargados
    if (nodeNames.length === 0) {
        mostrarError('No hay grafo cargado. Por favor, cargue un grafo primero.');
        return;
    }

    const id1 = nodeMap[nombre1];
    const id2 = nodeMap[nombre2];
    console.log("IDs encontrados:", id1, id2);

    if (!id1 || !id2) {
        mostrarError('Uno o ambos nodos no fueron encontrados.');
        return;
    }

    fetch(`/distancia/${encodeURIComponent(id1)}/${encodeURIComponent(id2)}`)
    .then(response => {
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('No hay grafo cargado. Por favor, cargue un grafo primero.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
        } else {
            showDistanceModal(data);
        }
    })
    .catch(error => {
        console.error("Error al calcular distancia:", error);
        mostrarError(error.message);
    });
}

// Variable para controlar el intervalo de consulta del estado
let metricsStatusInterval = null;

// Calcular métricas
function calcularMetricas() {
    console.log("script.js: calcularMetricas() called.");
    
    // Crear y mostrar el modal de progreso
    const progressModal = document.createElement('div');
    progressModal.className = 'progress-modal';
    progressModal.innerHTML = `
        <div class="progress-content">
            <h4>Calculando Métricas</h4>
            <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" 
                     style="width: 0%" 
                     aria-valuenow="0" 
                     aria-valuemin="0" 
                     aria-valuemax="100">0%</div>
            </div>
            <div class="metrics-status mt-3">
                <p class="text-muted mb-2">Métricas calculadas:</p>
                <ul class="metrics-list">
                </ul>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    // Iniciar el cálculo
    fetch('/calcular-metricas', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
            progressModal.remove();
            return;
        }
        
        // Iniciar la consulta del estado
        metricsStatusInterval = setInterval(() => {
            fetch('/estado-metricas')
                .then(response => response.json())
                .then(status => {
                    // Actualizar barra de progreso
                    const progressBar = progressModal.querySelector('.progress-bar');
                    progressBar.style.width = `${status.progreso}%`;
                    progressBar.setAttribute('aria-valuenow', status.progreso);
                    progressBar.textContent = `${Math.round(status.progreso)}%`;
                    
                    // Actualizar lista de métricas calculadas
                    const metricsList = progressModal.querySelector('.metrics-list');
                    metricsList.innerHTML = status.metricas_calculadas
                        .map(metrica => `<li><i class="bi bi-check-circle-fill text-success"></i> ${metrica}</li>`)
                        .join('');
                    
                    // Si hay error, mostrar y detener
                    if (status.error) {
                        clearInterval(metricsStatusInterval);
                        mostrarError(`Error al calcular métricas: ${status.error}`);
                        progressModal.remove();
                    }
                    
                    // Si el cálculo ha terminado
                    if (!status.en_progreso) {
                        clearInterval(metricsStatusInterval);
                        setTimeout(() => {
                            progressModal.remove();
                            mostrarNotificacion('¡Métricas calculadas exitosamente!', 'success');
                            if (window.resultsManager) {
                                window.resultsManager.showMetricsNotification(status.metricas_calculadas);
                                window.resultsManager.showModal();
                            }
                        }, 1000);
                    }
                })
                .catch(error => {
                    clearInterval(metricsStatusInterval);
                    mostrarError(error.message);
                    progressModal.remove();
                });
        }, 500); // Consultar cada 500ms
    })
    .catch(error => {
        mostrarError(error.message);
        progressModal.remove();
    });
}

// Visualizar grafo
function visualizarGrafo() {
    console.log("script.js: visualizarGrafo() called.");
    fetch('/grafo-visualizacion')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
        } else {
            document.getElementById('grafo-container').classList.remove('d-none');
            renderGrafo(data);
        }
    })
    .catch(error => mostrarError(error.message));
}

// Renderizar el grafo con D3.js
function renderGrafo(data) {
    console.log("script.js: renderGrafo() called.");
    
    // Limpiar el SVG
    d3.select("#grafo-svg").selectAll("*").remove();
    
    const svg = d3.select("#grafo-svg"),
          width = svg.node().getBoundingClientRect().width,
          height = svg.node().getBoundingClientRect().height;
    
    // Crear grupo principal para aplicar zoom
    const g = svg.append("g");
    
    // Configurar el zoom con límites más amplios y zoom inicial basado en el número de nodos
    const numNodos = data.nodes.length;
    const zoomInicial = Math.max(0.1, Math.min(1, 1000 / numNodos));
    
    const zoom = d3.zoom()
        .scaleExtent([0.05, 20]) // Permitir más zoom out y zoom in
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            // Ajustar la visibilidad de las etiquetas según el nivel de zoom
            const scale = event.transform.k;
            g.selectAll(".node text")
                .style("display", scale > 0.5 ? "block" : "none")
                .style("font-size", `${Math.min(14, 10/scale)}px`);
            // Ajustar el grosor de las líneas según el zoom
            g.selectAll(".link")
                .style("stroke-width", `${1/scale}px`);
            g.selectAll(".node circle")
                .attr("r", d => Math.max(2, Math.min(8, d.value/scale)));
        });
    
    // Aplicar zoom al SVG con zoom inicial
    svg.call(zoom)
       .call(zoom.transform, d3.zoomIdentity
            .translate(width/2, height/2)
            .scale(zoomInicial)
            .translate(-width/2, -height/2));
    
    // Resetear zoom con animación suave
    window.resetZoom = function() {
        svg.transition()
           .duration(750)
           .call(zoom.transform, d3.zoomIdentity
                .translate(width/2, height/2)
                .scale(zoomInicial)
                .translate(-width/2, -height/2));
    };
    
    // Optimizar fuerzas para grafos grandes
    const distanciaEnlaces = Math.min(100, 1000 / Math.sqrt(numNodos));
    const fuerzaCarga = -30 * Math.log10(numNodos);
    
    // Crear la simulación de fuerzas optimizada
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance(distanciaEnlaces))
        .force("charge", d3.forceManyBody()
            .strength(fuerzaCarga)
            .theta(0.9)  // Optimización del algoritmo Barnes-Hut
            .distanceMax(2000)) // Limitar la distancia máxima de repulsión
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(5))
        .alphaDecay(0.01) // Hacer la simulación más suave
        .velocityDecay(0.3); // Reducir la velocidad de movimiento
    
    // Crear las líneas (enlaces) con opacidad reducida
    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-opacity", 0.3); // Reducir opacidad para menos ruido visual
    
    // Crear los nodos
    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("id", d => `node-${d.id.replace(/[^a-zA-Z0-9]/g, "_")}`)
        .on("click", function(event, d) {
            event.stopPropagation();
            mostrarInfoNodo(d, event, this);
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    
    // Añadir círculos a los nodos con tamaño optimizado
    node.append("circle")
        .attr("r", d => Math.max(2, Math.min(8, d.value)))
        .attr("fill", d => getRandomColor(d.id))
        .style("stroke-width", "1px");
    
    // Añadir etiquetas a los nodos con visibilidad condicional
    node.append("text")
        .attr("dy", -8)
        .text(d => d.label || d.id)
        .attr("text-anchor", "middle")
        .style("display", "none") // Inicialmente ocultas
        .style("font-size", "10px")
        .style("paint-order", "stroke")
        .style("stroke-width", "2px")
        .style("stroke", "white");
    
    // Optimizar la función tick para mejor rendimiento
    simulation.on("tick", () => {
        // Limitar el área de movimiento para evitar que los nodos se alejen demasiado
        const padding = 50;
        data.nodes.forEach(d => {
            d.x = Math.max(padding, Math.min(width - padding, d.x));
            d.y = Math.max(padding, Math.min(height - padding, d.y));
        });
        
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    // Funciones para el arrastre optimizadas
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.1).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // Añadir leyenda con información del grafo
    const leyenda = svg.append("g")
        .attr("class", "leyenda")
        .attr("transform", `translate(10, ${height - 60})`);
    
    leyenda.append("rect")
        .attr("width", 180)
        .attr("height", 50)
        .attr("fill", "white")
        .attr("opacity", 0.8)
        .attr("rx", 5);
    
    leyenda.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .text(`Nodos: ${data.nodes.length}`)
        .style("font-size", "12px");
    
    leyenda.append("text")
        .attr("x", 10)
        .attr("y", 40)
        .text(`Enlaces: ${data.links.length}`)
        .style("font-size", "12px");
    
    // Generar colores aleatorios pero consistentes para cada nodo
    function getRandomColor(id) {
        // Asegurarse de que id sea una cadena
        id = String(id || '');
        // Verificar si id está vacío
        if (!id) {
            return 'hsl(0, 70%, 60%)'; // Color rojo por defecto
        }
        // Genera un color basado en el id para que el mismo nodo siempre tenga el mismo color
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    // Función para mostrar información del nodo
    function mostrarInfoNodo(nodo, event, nodeElement) {
        event.preventDefault();
        const nodeInfo = document.getElementById('node-info');
        
        // Log para depuración
        console.log('Mostrando info de nodo:', nodo);
        
        // Verificar que el nodo tiene un ID válido
        if (!nodo || !nodo.id) {
            console.error('Error: Nodo sin ID válido', nodo);
            nodeInfo.innerHTML = `<p class="error-text">Error: El nodo no tiene un ID válido</p>`;
            nodeInfo.style.left = `${event.clientX}px`;
            nodeInfo.style.top = `${event.clientY}px`;
            nodeInfo.style.display = 'block';
            return;
        }
        
        // Mostrar información de carga
        nodeInfo.innerHTML = `<p>Cargando información del nodo ${nodo.id}...</p>`;
        nodeInfo.style.left = `${event.clientX}px`;
        nodeInfo.style.top = `${event.clientY}px`;
        nodeInfo.style.display = 'block';
        
        const url = `/nodo/${encodeURIComponent(nodo.id)}`;
        console.log('Solicitando datos de:', url);
        
        // Obtener información detallada del nodo
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`No se encontró el nodo con ID ${nodo.id}`);
                    } else {
                        throw new Error(`Error del servidor: ${response.status}`);
                    }
                }
                
                // Verificar que la respuesta es JSON antes de parsearla
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    // Si no es JSON, leer como texto y mostrar error
                    return response.text().then(text => {
                        console.error('Respuesta no es JSON:', text);
                        throw new Error('La respuesta del servidor no es JSON válido');
                    });
                }
            })
            .then(data => {
                // Verificar si hay error
                if (data.error) {
                    nodeInfo.innerHTML = `<p class="error-text">Error: ${data.error}</p>`;
                } else {
                    // Crear contenido HTML
                    let html = `
                        <h6>Nodo: ${data.nombre}</h6>
                        <p><strong>ID:</strong> ${data.id}</p>
                        <p><strong>Adyacentes:</strong> ${data.num_adyacentes}</p>
                    `;
                    
                    // Función auxiliar para formatear valores numéricos
                    const formatNumber = (value) => {
                        return (value !== null && value !== undefined) ? parseFloat(value).toFixed(3) : '0.000';
                    };
                    
                    // Añadir métricas si están disponibles
                    if (data.centralidad !== undefined) {
                        html += `<p><strong>Centralidad:</strong> ${formatNumber(data.centralidad)}</p>`;
                    }
                    if (data.cercania !== undefined) {
                        html += `<p><strong>Cercanía:</strong> ${formatNumber(data.cercania)}</p>`;
                    }
                    if (data.intermediacion !== undefined) {
                        html += `<p><strong>Intermediación:</strong> ${formatNumber(data.intermediacion)}</p>`;
                    }
                    if (data.pagerank !== undefined) {
                        html += `<p><strong>PageRank:</strong> ${formatNumber(data.pagerank)}</p>`;
                    }
                    // Añadir métricas de HITS
                    if (data.authority !== undefined) {
                        html += `<p><strong>Authority:</strong> ${formatNumber(data.authority)}</p>`;
                    }
                    if (data.hub !== undefined) {
                        html += `<p><strong>Hub:</strong> ${formatNumber(data.hub)}</p>`;
                    }
                    
                    nodeInfo.innerHTML = html;
                }
            })
            .catch(error => {
                console.error("Error al obtener información del nodo:", error);
                nodeInfo.innerHTML = `<p class="error-text">❌ Error: ${error.message}</p>`;
            });
    }
    
    // Cerrar la información del nodo al hacer clic en otra parte
    // Necesita que 'svg' sea accesible globalmente o pasado como argumento si está fuera del alcance
    // Como está definido dentro de renderGrafo, se buscará la forma de adjuntar el listener correctamente.
    // Una opción es adjuntarlo al final de renderGrafo
    const svgElement = document.getElementById('grafo-svg');
    if (svgElement) {
        svgElement.addEventListener('click', () => {
            document.getElementById('node-info').style.display = 'none';
        });
    } else {
        console.error("Elemento SVG no encontrado para adjuntar listener de click.");
    }
}

// --- Final structure reminder ---
// Global functions (API calls, UI updates like modal/toast) are defined first.
// Then, the DOMContentLoaded listener attaches event handlers to elements. 

// --- API Call Functions (remain globally accessible for onclick) ---

// Información del grafo
function infoGrafo() {
    console.log("script.js: infoGrafo() called.");
    fetch('/info-grafo')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
        } else {
            mostrarResultados(data);
        }
    })
    .catch(error => mostrarError(error.message));
}

// Listar nodos
function listarNodos() {
    console.log("script.js: listarNodos() called.");
    fetch('/nodos')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
        } else {
            mostrarResultados(data);
        }
    })
    .catch(error => mostrarError(error.message));
}

// Listar aristas
function listarAristas() {
    console.log("script.js: listarAristas() called.");
    
    // Primero obtener la lista de nodos para tener sus nombres
    fetch('/nodos')
    .then(response => response.json())
    .then(nodesData => {
        if (nodesData.error) {
            mostrarError(nodesData.error);
            return;
        }

        // Crear un mapa de IDs a nombres
        const nodeMap = {};
        nodesData.nodos.forEach(node => {
            nodeMap[node.id] = node.nombre;
        });

        // Ahora obtener las aristas
        return fetch('/aristas')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mostrarError(data.error);
                return;
            }

            // Transformar los datos de aristas al formato esperado, usando los nombres
            const edgesFormatted = data.aristas.map(edge => ({
                nodo_origen: nodeMap[edge.source] || edge.source,
                nodos_destino: [nodeMap[edge.target] || edge.target]
            }));

            // Mostrar los resultados usando el ResultsManager
            if (window.resultsManager) {
                window.resultsManager.showEdgesList(edgesFormatted);
            }
        });
    })
    .catch(error => {
        console.error("Error al listar aristas:", error);
        mostrarError(error.message);
    });
}

// --- Event Listeners (Execute after DOM is loaded) ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed.");
    
    // Cargar el componente de resultados
    const resultsComponent = document.getElementById('resultsComponent');
    if (resultsComponent) {
        fetch('/static/components/results/results.html')
            .then(response => response.text())
            .then(html => {
                resultsComponent.innerHTML = html;
                // Inicializar el gestor de resultados después de cargar el HTML
                if (typeof ResultsManager !== 'undefined') {
                    window.resultsManager = new ResultsManager();
                }
            })
            .catch(error => console.error('Error al cargar el componente de resultados:', error));
    } else {
        console.error("Elemento con ID 'resultsComponent' no encontrado.");
    }

    // Cargar grafo - Attach listener after DOM ready
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            const nodesFile = document.getElementById('nodesFile');
            const edgesFile = document.getElementById('edgesFile');

            // Check if files are selected
            if (nodesFile && nodesFile.files.length > 0) {
                formData.append('nodes', nodesFile.files[0]);
            } else {
                mostrarError('Por favor, seleccione un archivo de nodos.');
                return;
            }

            if (edgesFile && edgesFile.files.length > 0) {
                 formData.append('edges', edgesFile.files[0]);
            } else {
                 mostrarError('Por favor, seleccione un archivo de aristas.');
                 return;
            }
            
            fetch('/cargar-grafo', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    mostrarError(data.error);
                } else {
                    mostrarResultados(data);
                    // Reinicializar el autocompletado después de cargar un nuevo grafo
                    initializeAutocomplete();
                }
            })
            .catch(error => mostrarError(error.message));
        });
    } else {
         console.error("Elemento con ID 'uploadForm' no encontrado.");
    }

    // Cerrar modal al hacer clic fuera - Attach listener after DOM ready
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            cerrarModal();
        });
    } else {
        console.error("Elemento con ID 'overlay' no encontrado.");
    }

    // Attach listeners to buttons that call global functions
    // Example for one button (optional, as onclick attributes are used)
    // const infoButton = document.querySelector('button[onclick="infoGrafo()"]');
    // if(infoButton) {
    //     infoButton.addEventListener('click', infoGrafo);
    // } 
    // Note: Keep onclick attributes for simplicity unless refactoring to fully JS-based event handling.
    
     // Attach listener for graph visualization node click
     const svgElement = document.getElementById('grafo-svg');
     if (svgElement) {
         svgElement.addEventListener('click', () => {
             const nodeInfo = document.getElementById('node-info');
             if (nodeInfo) {
                 nodeInfo.style.display = 'none';
             }
         });
     } else {
         // This might log if the graph hasn't been visualized yet, which is normal.
         // console.log("Elemento SVG 'grafo-svg' no encontrado al cargar la página.");
     }

    // Configurar autocompletado para búsqueda de nodo
    const buscarNodoInput = document.getElementById('buscarNodoInput');
    const buscarNodoSuggestions = document.getElementById('buscarNodoSuggestions');
    if (buscarNodoInput && buscarNodoSuggestions) {
        buscarNodoInput.addEventListener('input', () => {
            showSuggestions(buscarNodoInput, buscarNodoSuggestions);
        });
        
        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!buscarNodoInput.contains(e.target) && !buscarNodoSuggestions.contains(e.target)) {
                buscarNodoSuggestions.classList.remove('show');
            }
        });
    }

    // Configurar autocompletado para cálculo de distancia
    const nodoId1Input = document.getElementById('nodoId1');
    const nodoId1Suggestions = document.getElementById('nodoId1Suggestions');
    const nodoId2Input = document.getElementById('nodoId2');
    const nodoId2Suggestions = document.getElementById('nodoId2Suggestions');

    if (nodoId1Input && nodoId1Suggestions) {
        nodoId1Input.addEventListener('input', () => {
            showSuggestions(nodoId1Input, nodoId1Suggestions);
        });
        
        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!nodoId1Input.contains(e.target) && !nodoId1Suggestions.contains(e.target)) {
                nodoId1Suggestions.classList.remove('show');
            }
        });
    }

    if (nodoId2Input && nodoId2Suggestions) {
        nodoId2Input.addEventListener('input', () => {
            showSuggestions(nodoId2Input, nodoId2Suggestions);
        });
        
        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!nodoId2Input.contains(e.target) && !nodoId2Suggestions.contains(e.target)) {
                nodoId2Suggestions.classList.remove('show');
            }
        });
    }

    // Inicializar autocompletado
    initializeAutocomplete();

    // Manejar secciones desplegables
    const searchContainer = document.querySelector('.search-container');
    const distanceContainer = document.querySelector('.distance-container');

    if (searchContainer) {
        const searchHeader = searchContainer.querySelector('.search-header');
        const searchContent = searchContainer.querySelector('.search-content');
        const searchIcon = searchHeader.querySelector('.toggle-icon');

        searchHeader.addEventListener('click', () => {
            searchContent.classList.toggle('show');
            searchIcon.classList.toggle('rotated');
        });
    }

    if (distanceContainer) {
        const distanceHeader = distanceContainer.querySelector('.distance-header');
        const distanceContent = distanceContainer.querySelector('.distance-content');
        const distanceIcon = distanceHeader.querySelector('.toggle-icon');

        distanceHeader.addEventListener('click', () => {
            distanceContent.classList.toggle('show');
            distanceIcon.classList.toggle('rotated');
        });
    }
});

// --- API Call Functions (remain globally accessible for onclick) ---

// Información del grafo
function infoGrafo() {
    console.log("script.js: infoGrafo() called.");
    fetch('/info-grafo')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
        } else {
            mostrarResultados(data);
        }
    })
    .catch(error => mostrarError(error.message));
}

// Listar nodos
function listarNodos() {
    console.log("script.js: listarNodos() called.");
    fetch('/nodos')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
        } else {
            mostrarResultados(data);
        }
    })
    .catch(error => mostrarError(error.message));
}

// Listar aristas
function listarAristas() {
    console.log("script.js: listarAristas() called.");
    
    // Primero obtener la lista de nodos para tener sus nombres
    fetch('/nodos')
    .then(response => response.json())
    .then(nodesData => {
        if (nodesData.error) {
            mostrarError(nodesData.error);
            return;
        }

        // Crear un mapa de IDs a nombres
        const nodeMap = {};
        nodesData.nodos.forEach(node => {
            nodeMap[node.id] = node.nombre;
        });

        // Ahora obtener las aristas
        return fetch('/aristas')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mostrarError(data.error);
                return;
            }

            // Transformar los datos de aristas al formato esperado, usando los nombres
            const edgesFormatted = data.aristas.map(edge => ({
                nodo_origen: nodeMap[edge.source] || edge.source,
                nodos_destino: [nodeMap[edge.target] || edge.target]
            }));

            // Mostrar los resultados usando el ResultsManager
            if (window.resultsManager) {
                window.resultsManager.showEdgesList(edgesFormatted);
            }
        });
    })
    .catch(error => {
        console.error("Error al listar aristas:", error);
        mostrarError(error.message);
    });
}

// Calcular métricas
function calcularMetricas() {
    console.log("script.js: calcularMetricas() called.");
    
    // Crear y mostrar el modal de progreso
    const progressModal = document.createElement('div');
    progressModal.className = 'progress-modal';
    progressModal.innerHTML = `
        <div class="progress-content">
            <h4>Calculando Métricas</h4>
            <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" 
                     style="width: 0%" 
                     aria-valuenow="0" 
                     aria-valuemin="0" 
                     aria-valuemax="100">0%</div>
            </div>
            <div class="metrics-status mt-3">
                <p class="text-muted mb-2">Métricas calculadas:</p>
                <ul class="metrics-list">
                </ul>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    // Iniciar el cálculo
    fetch('/calcular-metricas', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
            progressModal.remove();
            return;
        }
        
        // Iniciar la consulta del estado
        metricsStatusInterval = setInterval(() => {
            fetch('/estado-metricas')
                .then(response => response.json())
                .then(status => {
                    // Actualizar barra de progreso
                    const progressBar = progressModal.querySelector('.progress-bar');
                    progressBar.style.width = `${status.progreso}%`;
                    progressBar.setAttribute('aria-valuenow', status.progreso);
                    progressBar.textContent = `${Math.round(status.progreso)}%`;
                    
                    // Actualizar lista de métricas calculadas
                    const metricsList = progressModal.querySelector('.metrics-list');
                    metricsList.innerHTML = status.metricas_calculadas
                        .map(metrica => `<li><i class="bi bi-check-circle-fill text-success"></i> ${metrica}</li>`)
                        .join('');
                    
                    // Si hay error, mostrar y detener
                    if (status.error) {
                        clearInterval(metricsStatusInterval);
                        mostrarError(`Error al calcular métricas: ${status.error}`);
                        progressModal.remove();
                    }
                    
                    // Si el cálculo ha terminado
                    if (!status.en_progreso) {
                        clearInterval(metricsStatusInterval);
                        setTimeout(() => {
                            progressModal.remove();
                            mostrarNotificacion('¡Métricas calculadas exitosamente!', 'success');
                            if (window.resultsManager) {
                                window.resultsManager.showMetricsNotification(status.metricas_calculadas);
                                window.resultsManager.showModal();
                            }
                        }, 1000);
                    }
                })
                .catch(error => {
                    clearInterval(metricsStatusInterval);
                    mostrarError(error.message);
                    progressModal.remove();
                });
        }, 500); // Consultar cada 500ms
    })
    .catch(error => {
        mostrarError(error.message);
        progressModal.remove();
    });
}

// Visualizar grafo
function visualizarGrafo() {
    console.log("script.js: visualizarGrafo() called.");
    fetch('/grafo-visualizacion')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarError(data.error);
        } else {
            document.getElementById('grafo-container').classList.remove('d-none');
            renderGrafo(data);
        }
    })
    .catch(error => mostrarError(error.message));
}

// Renderizar el grafo con D3.js
function renderGrafo(data) {
    console.log("script.js: renderGrafo() called.");
    
    // Limpiar el SVG
    d3.select("#grafo-svg").selectAll("*").remove();
    
    const svg = d3.select("#grafo-svg"),
          width = svg.node().getBoundingClientRect().width,
          height = svg.node().getBoundingClientRect().height;
    
    // Crear grupo principal para aplicar zoom
    const g = svg.append("g");
    
    // Configurar el zoom con límites más amplios y zoom inicial basado en el número de nodos
    const numNodos = data.nodes.length;
    const zoomInicial = Math.max(0.1, Math.min(1, 1000 / numNodos));
    
    const zoom = d3.zoom()
        .scaleExtent([0.05, 20]) // Permitir más zoom out y zoom in
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            // Ajustar la visibilidad de las etiquetas según el nivel de zoom
            const scale = event.transform.k;
            g.selectAll(".node text")
                .style("display", scale > 0.5 ? "block" : "none")
                .style("font-size", `${Math.min(14, 10/scale)}px`);
            // Ajustar el grosor de las líneas según el zoom
            g.selectAll(".link")
                .style("stroke-width", `${1/scale}px`);
            g.selectAll(".node circle")
                .attr("r", d => Math.max(2, Math.min(8, d.value/scale)));
        });
    
    // Aplicar zoom al SVG con zoom inicial
    svg.call(zoom)
       .call(zoom.transform, d3.zoomIdentity
            .translate(width/2, height/2)
            .scale(zoomInicial)
            .translate(-width/2, -height/2));
    
    // Resetear zoom con animación suave
    window.resetZoom = function() {
        svg.transition()
           .duration(750)
           .call(zoom.transform, d3.zoomIdentity
                .translate(width/2, height/2)
                .scale(zoomInicial)
                .translate(-width/2, -height/2));
    };
    
    // Optimizar fuerzas para grafos grandes
    const distanciaEnlaces = Math.min(100, 1000 / Math.sqrt(numNodos));
    const fuerzaCarga = -30 * Math.log10(numNodos);
    
    // Crear la simulación de fuerzas optimizada
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance(distanciaEnlaces))
        .force("charge", d3.forceManyBody()
            .strength(fuerzaCarga)
            .theta(0.9)  // Optimización del algoritmo Barnes-Hut
            .distanceMax(2000)) // Limitar la distancia máxima de repulsión
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(5))
        .alphaDecay(0.01) // Hacer la simulación más suave
        .velocityDecay(0.3); // Reducir la velocidad de movimiento
    
    // Crear las líneas (enlaces) con opacidad reducida
    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-opacity", 0.3); // Reducir opacidad para menos ruido visual
    
    // Crear los nodos
    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("id", d => `node-${d.id.replace(/[^a-zA-Z0-9]/g, "_")}`)
        .on("click", function(event, d) {
            event.stopPropagation();
            mostrarInfoNodo(d, event, this);
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    
    // Añadir círculos a los nodos con tamaño optimizado
    node.append("circle")
        .attr("r", d => Math.max(2, Math.min(8, d.value)))
        .attr("fill", d => getRandomColor(d.id))
        .style("stroke-width", "1px");
    
    // Añadir etiquetas a los nodos con visibilidad condicional
    node.append("text")
        .attr("dy", -8)
        .text(d => d.label || d.id)
        .attr("text-anchor", "middle")
        .style("display", "none") // Inicialmente ocultas
        .style("font-size", "10px")
        .style("paint-order", "stroke")
        .style("stroke-width", "2px")
        .style("stroke", "white");
    
    // Optimizar la función tick para mejor rendimiento
    simulation.on("tick", () => {
        // Limitar el área de movimiento para evitar que los nodos se alejen demasiado
        const padding = 50;
        data.nodes.forEach(d => {
            d.x = Math.max(padding, Math.min(width - padding, d.x));
            d.y = Math.max(padding, Math.min(height - padding, d.y));
        });
        
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    // Funciones para el arrastre optimizadas
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.1).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // Añadir leyenda con información del grafo
    const leyenda = svg.append("g")
        .attr("class", "leyenda")
        .attr("transform", `translate(10, ${height - 60})`);
    
    leyenda.append("rect")
        .attr("width", 180)
        .attr("height", 50)
        .attr("fill", "white")
        .attr("opacity", 0.8)
        .attr("rx", 5);
    
    leyenda.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .text(`Nodos: ${data.nodes.length}`)
        .style("font-size", "12px");
    
    leyenda.append("text")
        .attr("x", 10)
        .attr("y", 40)
        .text(`Enlaces: ${data.links.length}`)
        .style("font-size", "12px");
    
    // Generar colores aleatorios pero consistentes para cada nodo
    function getRandomColor(id) {
        // Asegurarse de que id sea una cadena
        id = String(id || '');
        // Verificar si id está vacío
        if (!id) {
            return 'hsl(0, 70%, 60%)'; // Color rojo por defecto
        }
        // Genera un color basado en el id para que el mismo nodo siempre tenga el mismo color
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    // Función para mostrar información del nodo
    function mostrarInfoNodo(nodo, event, nodeElement) {
        event.preventDefault();
        const nodeInfo = document.getElementById('node-info');
        
        // Log para depuración
        console.log('Mostrando info de nodo:', nodo);
        
        // Verificar que el nodo tiene un ID válido
        if (!nodo || !nodo.id) {
            console.error('Error: Nodo sin ID válido', nodo);
            nodeInfo.innerHTML = `<p class="error-text">Error: El nodo no tiene un ID válido</p>`;
            nodeInfo.style.left = `${event.clientX}px`;
            nodeInfo.style.top = `${event.clientY}px`;
            nodeInfo.style.display = 'block';
            return;
        }
        
        // Mostrar información de carga
        nodeInfo.innerHTML = `<p>Cargando información del nodo ${nodo.id}...</p>`;
        nodeInfo.style.left = `${event.clientX}px`;
        nodeInfo.style.top = `${event.clientY}px`;
        nodeInfo.style.display = 'block';
        
        const url = `/nodo/${encodeURIComponent(nodo.id)}`;
        console.log('Solicitando datos de:', url);
        
        // Obtener información detallada del nodo
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`No se encontró el nodo con ID ${nodo.id}`);
                    } else {
                        throw new Error(`Error del servidor: ${response.status}`);
                    }
                }
                
                // Verificar que la respuesta es JSON antes de parsearla
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    // Si no es JSON, leer como texto y mostrar error
                    return response.text().then(text => {
                        console.error('Respuesta no es JSON:', text);
                        throw new Error('La respuesta del servidor no es JSON válido');
                    });
                }
            })
            .then(data => {
                // Verificar si hay error
                if (data.error) {
                    nodeInfo.innerHTML = `<p class="error-text">Error: ${data.error}</p>`;
                } else {
                    // Crear contenido HTML
                    let html = `
                        <h6>Nodo: ${data.nombre}</h6>
                        <p><strong>ID:</strong> ${data.id}</p>
                        <p><strong>Adyacentes:</strong> ${data.num_adyacentes}</p>
                    `;
                    
                    // Función auxiliar para formatear valores numéricos
                    const formatNumber = (value) => {
                        return (value !== null && value !== undefined) ? parseFloat(value).toFixed(3) : '0.000';
                    };
                    
                    // Añadir métricas si están disponibles
                    if (data.centralidad !== undefined) {
                        html += `<p><strong>Centralidad:</strong> ${formatNumber(data.centralidad)}</p>`;
                    }
                    if (data.cercania !== undefined) {
                        html += `<p><strong>Cercanía:</strong> ${formatNumber(data.cercania)}</p>`;
                    }
                    if (data.intermediacion !== undefined) {
                        html += `<p><strong>Intermediación:</strong> ${formatNumber(data.intermediacion)}</p>`;
                    }
                    if (data.pagerank !== undefined) {
                        html += `<p><strong>PageRank:</strong> ${formatNumber(data.pagerank)}</p>`;
                    }
                    // Añadir métricas de HITS
                    if (data.authority !== undefined) {
                        html += `<p><strong>Authority:</strong> ${formatNumber(data.authority)}</p>`;
                    }
                    if (data.hub !== undefined) {
                        html += `<p><strong>Hub:</strong> ${formatNumber(data.hub)}</p>`;
                    }
                    
                    nodeInfo.innerHTML = html;
                }
            })
            .catch(error => {
                console.error("Error al obtener información del nodo:", error);
                nodeInfo.innerHTML = `<p class="error-text">❌ Error: ${error.message}</p>`;
            });
    }
    
    // Cerrar la información del nodo al hacer clic en otra parte
    // Necesita que 'svg' sea accesible globalmente o pasado como argumento si está fuera del alcance
    // Como está definido dentro de renderGrafo, se buscará la forma de adjuntar el listener correctamente.
    // Una opción es adjuntarlo al final de renderGrafo
    const svgElement = document.getElementById('grafo-svg');
    if (svgElement) {
        svgElement.addEventListener('click', () => {
            document.getElementById('node-info').style.display = 'none';
        });
    } else {
        console.error("Elemento SVG no encontrado para adjuntar listener de click.");
    }
} 