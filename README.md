# API de Grafos

Esta API permite interactuar con grafos a través de una interfaz web y endpoints RESTful. Utiliza la clase `Grafo` para realizar operaciones y cálculos sobre grafos para el análisis de redes. Para más información, consultar `GraphAPI - Documentación.pdf`.

## Requisitos

- Python 3.8+
- Dependencias listadas en `requirements.txt`

## Instalación

1. Clonar o descargar el repositorio
2. Instalar las dependencias:

```bash
pip install -r requirements.txt
```

## Uso

1. Iniciar la aplicación:

```bash
python app.py
```

2. Abrir un navegador y acceder a `http://localhost:5000`

3. Cargar archivos CSV:
   - `nodes.csv`: Debe contener al menos columnas `id` y `label`
   - `edges.csv`: Debe contener al menos columnas `source` y `target`

## Características

- **Cargar Grafo**: Sube archivos CSV de nodos y aristas para crear un grafo
- **Información del Grafo**: Muestra número de nodos y aristas
- **Listar Nodos**: Muestra información de todos los nodos
- **Listar Aristas**: Muestra todas las conexiones entre nodos
- **Calcular Métricas**: Calcula centralidad, cercanía, intermediación, PageRank y HITS
- **Buscar Nodo**: Busca un nodo por su nombre
- **Calcular Distancia**: Calcula la distancia geodésica entre dos nodos

## Endpoints API

- `POST /cargar-grafo`: Carga archivos CSV de nodos y aristas
- `GET /info-grafo`: Retorna información básica del grafo
- `GET /nodos`: Retorna lista de nodos
- `GET /nodo/<id_nodo>`: Retorna información detallada de un nodo
- `POST /calcular-metricas`: Calcula todas las métricas disponibles
- `GET /aristas`: Retorna lista de aristas
- `GET /distancia/<id_nodo1>/<id_nodo2>`: Calcula distancia entre dos nodos
- `GET /buscar-nodo/<nombre>`: Busca un nodo por nombre

## Estructura de archivos CSV

### nodes.csv

```
id,label
1,Nodo 1
2,Nodo 2
3,Nodo 3
...
```

### edges.csv

```
source,target
1,2
1,3
2,3
...
``` 
