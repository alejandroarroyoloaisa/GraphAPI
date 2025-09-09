from flask import Flask, request, jsonify, send_from_directory
import os
from werkzeug.utils import secure_filename
from models.Grafo import Grafo
from threading import Thread

app = Flask(__name__, static_folder='static')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'csv'}

# Crear directorio de uploads si no existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Grafo global que se utilizará en la aplicación
grafo = None

# Variable global para almacenar el estado del cálculo de métricas
metricas_estado = {
    'en_progreso': False,
    'progreso': 0,
    'metricas_calculadas': set(),
    'error': None
}

def allowed_file(filename):
    """Verifica que el archivo tenga una extensión permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    """Página principal de la aplicación"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/cargar-grafo', methods=['POST'])
def cargar_grafo():
    """Carga un grafo a partir de archivos CSV de nodos y aristas"""
    # Verificar que los archivos están en la solicitud
    if 'nodes' not in request.files or 'edges' not in request.files:
        return jsonify({'error': 'Se requieren archivos de nodos y aristas'}), 400
    
    nodes_file = request.files['nodes']
    edges_file = request.files['edges']
    
    # Verificar que los archivos tienen nombre y son del tipo permitido
    if nodes_file.filename == '' or edges_file.filename == '':
        return jsonify({'error': 'No se seleccionaron archivos'}), 400
    
    if not (allowed_file(nodes_file.filename) and allowed_file(edges_file.filename)):
        return jsonify({'error': 'Formato de archivo no permitido'}), 400
    
    # Guardar los archivos
    nodes_path = os.path.join(app.config['UPLOAD_FOLDER'], 'nodes.csv')
    edges_path = os.path.join(app.config['UPLOAD_FOLDER'], 'edges.csv')
    
    nodes_file.save(nodes_path)
    edges_file.save(edges_path)
    
    # Crear el grafo
    global grafo
    try:
        grafo = Grafo(nodes_path, edges_path)
        num_nodos = grafo.get_num_nodos()
        num_aristas = sum(nodo.get_num_adyacentes() for nodo in grafo.get_nodos().values()) // 2
        return jsonify({
            'mensaje': f'¡Grafo cargado exitosamente! Contiene {num_nodos} nodos y {num_aristas} aristas.',
            'num_nodos': num_nodos,
            'num_aristas': num_aristas
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error al cargar el grafo: {str(e)}'}), 500

@app.route('/info-grafo', methods=['GET'])
def info_grafo():
    """Retorna información básica del grafo"""
    global grafo
    if grafo is None:
        return jsonify({'error': 'No hay grafo cargado. Por favor, cargue un grafo primero.'}), 400
    
    # Obtener información básica
    num_nodos = grafo.get_num_nodos()
    
    # Contar aristas (cada arista está contada dos veces, una por cada nodo)
    total_aristas = sum(nodo.get_num_adyacentes() for nodo in grafo.get_nodos().values()) // 2
    
    return jsonify({
        'mensaje': f'Información del grafo obtenida: {num_nodos} nodos y {total_aristas} aristas',
        'num_nodos': num_nodos,
        'num_aristas': total_aristas
    }), 200

@app.route('/nodos', methods=['GET'])
def listar_nodos():
    """Retorna la lista de nodos en el grafo"""
    global grafo
    if grafo is None:
        return jsonify({'error': 'No hay grafo cargado. Por favor, cargue un grafo primero.'}), 400
    
    nodos = []
    for nodo in grafo.get_nodos().values():
        nodos.append({
            'id': nodo.get_id(),
            'nombre': nodo.get_nombre(),
            'num_adyacentes': nodo.get_num_adyacentes()
        })
    
    return jsonify({
        'mensaje': f'Se encontraron {len(nodos)} nodos en el grafo',
        'nodos': nodos
    }), 200

@app.route('/nodo/<id_nodo>', methods=['GET'])
def info_nodo(id_nodo):
    """Retorna información detallada de un nodo específico"""
    global grafo
    if grafo is None:
        return jsonify({'error': 'No hay grafo cargado. Por favor, cargue un grafo primero.'}), 400
    
    try:
        # Registrar el ID del nodo solicitado para depuración
        print(f"Solicitud de información para nodo con ID: '{id_nodo}'")
        
        nodo = grafo.get_nodo(id_nodo)
        if nodo is None:
            # Registrar IDs disponibles para depuración
            ids_disponibles = list(grafo.get_nodos().keys())
            print(f"El nodo con ID '{id_nodo}' no existe. IDs disponibles: {ids_disponibles[:10]}")
            return jsonify({'error': f"No existe el nodo con ID '{id_nodo}'"}), 404
        
        # Obtener IDs de nodos adyacentes
        adyacentes = [ady.get_id() for ady in nodo.get_adyacentes()]
        
        # Construir respuesta con información del nodo
        respuesta = {
            'mensaje': f'Información detallada del nodo {nodo.get_nombre()} (ID: {id_nodo})',
            'id': nodo.get_id(),
            'nombre': nodo.get_nombre(),
            'num_adyacentes': nodo.get_num_adyacentes(),
            'adyacentes': adyacentes,
            'centralidad': nodo.get_centralidad(),
            'cercania': nodo.get_cercania(),
            'intermediacion': nodo.get_intermediacion(),
            'pagerank': nodo.get_pagerank(),
            'authority': nodo.get_auth(),
            'hub': nodo.get_hub()
        }
        
        return jsonify(respuesta), 200
    except Exception as e:
        print(f"Error al procesar información del nodo: {str(e)}")
        return jsonify({'error': f'Error al procesar información del nodo: {str(e)}'}), 500

@app.route('/calcular-metricas', methods=['POST'])
def calcular_metricas():
    """Inicia el cálculo de métricas de manera asíncrona"""
    global grafo, metricas_estado
    
    if grafo is None:
        return jsonify({'error': 'No hay grafo cargado. Por favor, cargue un grafo primero.'}), 400
    
    if metricas_estado['en_progreso']:
        return jsonify({'error': 'Ya hay un cálculo de métricas en progreso.'}), 400
    
    # Reiniciar estado
    metricas_estado['en_progreso'] = True
    metricas_estado['progreso'] = 0
    metricas_estado['metricas_calculadas'] = set()
    metricas_estado['error'] = None
    
    # Iniciar el cálculo en un hilo separado
    thread = Thread(target=calcular_metricas_async)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'mensaje': 'Cálculo de métricas iniciado',
        'estado': 'iniciado'
    })

@app.route('/estado-metricas', methods=['GET'])
def obtener_estado_metricas():
    """Obtiene el estado actual del cálculo de métricas"""
    global metricas_estado
    
    return jsonify({
        'en_progreso': metricas_estado['en_progreso'],
        'progreso': metricas_estado['progreso'],
        'metricas_calculadas': list(metricas_estado['metricas_calculadas']),
        'error': metricas_estado['error']
    })

def calcular_metricas_async():
    """Función que realiza el cálculo de métricas de manera asíncrona"""
    global grafo, metricas_estado
    
    try:
        # Lista de métricas a calcular
        metricas = [
            ('Centralidad', grafo.calcular_centralidad),
            ('Cercanía', grafo.calcular_cercania),
            ('Intermediación', grafo.calcular_intermediacion),
            ('PageRank', grafo.calcular_pagerank),
            ('HITS', grafo.calcular_hits)
        ]
        
        total_metricas = len(metricas)
        
        for i, (nombre, funcion) in enumerate(metricas):
            try:
                funcion()
                metricas_estado['metricas_calculadas'].add(nombre)
            except Exception as e:
                print(f"Error al calcular {nombre}: {str(e)}")
            
            # Actualizar progreso
            metricas_estado['progreso'] = ((i + 1) / total_metricas) * 100
    
    except Exception as e:
        metricas_estado['error'] = str(e)
    
    finally:
        metricas_estado['en_progreso'] = False

@app.route('/aristas', methods=['GET'])
def listar_aristas():
    """Retorna la lista de aristas en el grafo"""
    global grafo
    if grafo is None:
        return jsonify({'error': 'No hay grafo cargado. Por favor, cargue un grafo primero.'}), 400
    
    aristas = []
    visitadas = set()  # Para evitar duplicados en grafos no dirigidos
    
    for id_nodo, nodo in grafo.get_nodos().items():
        for ady in nodo.get_adyacentes():
            # Crear un identificador único para cada arista
            arista_id = tuple(sorted([id_nodo, ady.get_id()]))
            if arista_id not in visitadas:
                aristas.append({
                    'source': id_nodo,
                    'target': ady.get_id()
                })
                visitadas.add(arista_id)
    
    return jsonify({
        'mensaje': f'Se encontraron {len(aristas)} aristas en el grafo',
        'aristas': aristas
    }), 200

@app.route('/distancia/<id_nodo1>/<id_nodo2>', methods=['GET'])
def calcular_distancia(id_nodo1, id_nodo2):
    """Calcula la distancia geodésica entre dos nodos"""
    global grafo
    if grafo is None:
        return jsonify({'error': 'No hay grafo cargado. Por favor, cargue un grafo primero.'}), 400
    
    if not grafo.existe_nodo(id_nodo1) or not grafo.existe_nodo(id_nodo2):
        return jsonify({'error': 'Uno o ambos nodos no existen'}), 404
    
    distancia = grafo.distancia_geodesica_BFS(id_nodo1, id_nodo2)
    
    nodo1 = grafo.get_nodo(id_nodo1).get_nombre()
    nodo2 = grafo.get_nodo(id_nodo2).get_nombre()
    
    if distancia == float('inf'):
        return jsonify({
            'mensaje': f'No existe camino entre los nodos "{nodo1}" y "{nodo2}"',
            'distancia': 'infinito', 
            'nodo1': {'id': id_nodo1, 'nombre': nodo1},
            'nodo2': {'id': id_nodo2, 'nombre': nodo2}
        }), 200
    
    return jsonify({
        'mensaje': f'La distancia entre "{nodo1}" y "{nodo2}" es {distancia}',
        'distancia': distancia,
        'nodo1': {'id': id_nodo1, 'nombre': nodo1},
        'nodo2': {'id': id_nodo2, 'nombre': nodo2}
    }), 200

@app.route('/buscar-nodo/<nombre>', methods=['GET'])
def buscar_nodo(nombre):
    """Busca un nodo por su nombre"""
    global grafo
    if grafo is None:
        return jsonify({'error': 'No hay grafo cargado. Por favor, cargue un grafo primero.'}), 400
    
    nodo = grafo.buscar_nodo_por_nombre(nombre)
    if nodo is None:
        return jsonify({'error': f'No se encontró ningún nodo con nombre "{nombre}"'}), 404
    
    # Obtener IDs de nodos adyacentes para mostrar información más completa
    adyacentes = [ady.get_id() for ady in nodo.get_adyacentes()]
    
    return jsonify({
        'mensaje': f'Nodo "{nombre}" encontrado con ID: {nodo.get_id()}',
        'id': nodo.get_id(),
        'nombre': nodo.get_nombre(),
        'num_adyacentes': nodo.get_num_adyacentes(),
        'adyacentes': adyacentes
    }), 200

@app.route('/grafo-visualizacion', methods=['GET'])
def grafo_visualizacion():
    """Obtiene los datos del grafo en formato para visualización"""
    global grafo
    if grafo is None:
        return jsonify({'error': 'No hay grafo cargado. Por favor, cargue un grafo primero.'}), 400
    
    try:
        nodos = []
        for nodo in grafo.get_nodos().values():
            # Asegurarse de que los IDs siempre sean strings
            id_nodo = str(nodo.get_id())
            nodos.append({
                'id': id_nodo,
                'label': nodo.get_nombre(),
                'value': nodo.get_centralidad() or 1  # Tamaño basado en centralidad
            })
        
        enlaces = []
        visitadas = set()  # Para evitar duplicados en grafos no dirigidos
        
        for id_nodo, nodo in grafo.get_nodos().items():
            # Asegurarse de que los IDs siempre sean strings
            id_nodo = str(id_nodo)
            for ady in nodo.get_adyacentes():
                id_ady = str(ady.get_id())
                # Crear un identificador único para cada arista
                arista_id = tuple(sorted([id_nodo, id_ady]))
                if arista_id not in visitadas:
                    enlaces.append({
                        'source': id_nodo,
                        'target': id_ady
                    })
                    visitadas.add(arista_id)
        
        # Imprimir algunos IDs para depuración
        print(f"Nodos generados para visualización: {[n['id'] for n in nodos[:5]]}")
        
        return jsonify({
            'mensaje': f'Visualización del grafo generada con {len(nodos)} nodos y {len(enlaces)} aristas',
            'nodes': nodos,
            'links': enlaces
        }), 200
    except Exception as e:
        print(f"Error al generar visualización del grafo: {str(e)}")
        return jsonify({'error': f'Error al generar visualización del grafo: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True) 