import csv
import numpy as np
from collections import deque, defaultdict
from models.Nodo import Nodo
import math

class Grafo:
    def __init__(self, nodos_file, edges_file):
        self.__nodos = self.build_nodes(nodos_file, edges_file)
    
    def build_nodes(self, nodos_file, edges_file):
        nodes = {}
        # Cargar nodos desde CSV con encabezados
        try:
            with open(nodos_file, 'r', newline='', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    # Asegurarse de que existe el campo id
                    if 'id' not in row:
                        continue
                    
                    id_nodo = str(row['id']).strip()  # Convertir a string y eliminar espacios
                    
                    # Si el ID está vacío, saltarlo
                    if not id_nodo:
                        continue
                    
                    # Manejar caso donde 'label' está ausente o es inválido
                    if 'label' not in row or not row['label'] or row['label'].strip() == '':
                        nombre_nodo = id_nodo  # Usar ID como etiqueta
                    else:
                        nombre_nodo = row['label'].strip()
                    
                    nodes[id_nodo] = Nodo(id_nodo, nombre_nodo)
        except UnicodeDecodeError:
            # Si falla con utf-8, intentar con latin-1
            with open(nodos_file, 'r', newline='', encoding='latin-1') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    # Asegurarse de que existe el campo id
                    if 'id' not in row:
                        continue
                    
                    id_nodo = str(row['id']).strip()  # Convertir a string y eliminar espacios
                    
                    # Si el ID está vacío, saltarlo
                    if not id_nodo:
                        continue
                    
                    # Manejar caso donde 'label' está ausente o es inválido
                    if 'label' not in row or not row['label'] or row['label'].strip() == '':
                        nombre_nodo = id_nodo  # Usar ID como etiqueta
                    else:
                        nombre_nodo = row['label'].strip()
                    
                    nodes[id_nodo] = Nodo(id_nodo, nombre_nodo)
        
        # Cargar aristas desde CSV con encabezados
        try:
            with open(edges_file, 'r', newline='', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    # Asegurarse de que existen los campos source y target
                    if 'source' not in row or 'target' not in row:
                        continue
                    
                    id1 = str(row['source']).strip()  # Convertir a string y eliminar espacios
                    id2 = str(row['target']).strip()  # Convertir a string y eliminar espacios
                    
                    # Si alguno de los IDs está vacío, saltarlo
                    if not id1 or not id2:
                        continue
                    
                    # Si los nodos existen, añadir la arista
                    if id1 in nodes and id2 in nodes:
                        nodes[id1].agregar_adyacente(nodes[id2])
                        nodes[id2].agregar_adyacente(nodes[id1])  # No dirigido
        except UnicodeDecodeError:
            # Si falla con utf-8, intentar con latin-1
            with open(edges_file, 'r', newline='', encoding='latin-1') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    # Asegurarse de que existen los campos source y target
                    if 'source' not in row or 'target' not in row:
                        continue
                    
                    id1 = str(row['source']).strip()  # Convertir a string y eliminar espacios
                    id2 = str(row['target']).strip()  # Convertir a string y eliminar espacios
                    
                    # Si alguno de los IDs está vacío, saltarlo
                    if not id1 or not id2:
                        continue
                    
                    # Si los nodos existen, añadir la arista
                    if id1 in nodes and id2 in nodes:
                        nodes[id1].agregar_adyacente(nodes[id2])
                        nodes[id2].agregar_adyacente(nodes[id1])  # No dirigido
        
        return nodes

    def agregar_nodo(self, id, nombre):
        if id not in self.__nodos:
            self.__nodos[id] = Nodo(id, nombre)
    
    def eliminar_nodo(self, id):
        if id in self.__nodos:
            # Eliminar este nodo de la lista de adyacentes de otros nodos
            nodo_a_eliminar = self.__nodos[id]
            for nodo in self.__nodos.values():
                nodo.eliminar_adyacente(nodo_a_eliminar)
            # Eliminar el nodo del grafo
            del self.__nodos[id]

    def agregar_arista(self, id1, id2):
        if id1 in self.__nodos and id2 in self.__nodos:
            self.__nodos[id1].agregar_adyacente(self.__nodos[id2])
            self.__nodos[id2].agregar_adyacente(self.__nodos[id1])  # No dirigido
    
    def eliminar_arista(self, id1, id2):
        if id1 in self.__nodos and id2 in self.__nodos:
            self.__nodos[id1].eliminar_adyacente(self.__nodos[id2])
            self.__nodos[id2].eliminar_adyacente(self.__nodos[id1])
    
    # Getters
    def get_nodos(self):
        return self.__nodos
    
    def get_nodo(self, id):
        return self.__nodos.get(id)
    
    def get_num_nodos(self):
        return len(self.__nodos)
    
    def get_adyacentes(self, id):
        if id in self.__nodos:
            return self.__nodos[id].get_adyacentes()
        return set()
    
    def existe_nodo(self, id):
        return id in self.__nodos
    
    def existe_arista(self, id1, id2):
        if id1 in self.__nodos and id2 in self.__nodos:
            return self.__nodos[id2] in self.__nodos[id1].get_adyacentes()
        return False
    
    def buscar_nodo_por_nombre(self, nombre):
        for nodo in self.__nodos.values():
            if nodo.get_nombre() == nombre:
                return nodo
        return None
        
    # MÉTRICAS DE ANÁLISIS DE REDES
    
    def calcular_matriz_adyacencia(self):
        """
        Calcula la matriz de adyacencia según el pseudocódigo.
        Retorna la matriz, el mapeo de ids a posiciones y viceversa.
        
        """
        n = len(self.__nodos)
        matriz = np.zeros((n, n), dtype=int)
        id2pos = {}
        pos2id = []
        
        # Siguiendo estrictamente el pseudocódigo
        indice = 0
        for clave, nodo in self.__nodos.items():
            id_str = str(clave)  # Convertir a string para asegurar consistencia
            id2pos[id_str] = indice
            pos2id.append(id_str)
            indice += 1
            
            for ady in nodo.get_adyacentes():
                id_ady = str(ady.get_id())  # Convertir a string para asegurar consistencia
                if id_ady in id2pos:  # Verificar que el ID existe en el mapeo
                    matriz[id2pos[id_str]][id2pos[id_ady]] = 1
                    matriz[id2pos[id_ady]][id2pos[id_str]] = 1  # Grafo no dirigido
        
        return matriz, id2pos, pos2id
    
    def calcular_centralidad(self):
        """
        Calcula la centralidad según el pseudocódigo y la guarda en cada nodo.
        """
        matriz, id2pos, _ = self.calcular_matriz_adyacencia()
        n = len(self.__nodos)
        
        for nodo in self.__nodos.values():
            id_nodo = nodo.get_id()
            # Calcular centralidad de grado (degree centrality)
            # Para grafos no dirigidos, in-degree = out-degree = degree
            if n > 1:  # Evitar división por cero si solo hay un nodo
                centralidad = sum(matriz[id2pos[id_nodo]]) / (n - 1)
            else:
                centralidad = 0 # O definir como 0 si solo hay un nodo
            
            # Guardar la centralidad calculada
            nodo.set_centralidad(centralidad)

    def calcular_cercania(self):
        """
        Calcula la cercanía según el pseudocódigo y la guarda en cada nodo.
        """
        N = len(self.__nodos)
        
        for nodo in self.__nodos.values():
            suma = 0
            id_nodo = nodo.get_id()
            
            for nodo_g in self.__nodos.values():
                id_g = nodo_g.get_id()
                if id_nodo != id_g:
                    d = self.distancia_geodesica_BFS(id_nodo, id_g)
                    if d != float('inf'):  # Si hay un camino
                        suma += d
            
            if suma > 0:
                nodo.set_cercania((N - 1) / suma)
            else:
                nodo.set_cercania(0)  # Nodo aislado
    
    def distancia_geodesica_BFS(self, id_ini, id_fin):
        """
        Calcula la distancia geodésica entre dos nodos mediante BFS
        como especifica el pseudocódigo.
        """
        if id_ini == id_fin:
            return 0
            
        # Inicialización según pseudocódigo
        cola = deque()
        visitado = {}
        distancia = {}
        
        # Configuración inicial del nodo de partida
        cola.append(id_ini)
        visitado[id_ini] = True
        distancia[id_ini] = 0
        
        # Bucle principal del BFS
        while cola:
            nodo_actual = cola.popleft()
            
            if nodo_actual == id_fin:
                return distancia[nodo_actual]
            
            # Exploración nivel por nivel
            for nodo_ady in [ady.get_id() for ady in self.__nodos[nodo_actual].get_adyacentes()]:
                if nodo_ady not in visitado:
                    cola.append(nodo_ady)
                    visitado[nodo_ady] = True
                    distancia[nodo_ady] = distancia[nodo_actual] + 1
        
        return float('inf')  # No hay camino
    
    def calcular_intermediacion(self):
        """
        Calcula la intermediación según el pseudocódigo y la guarda en cada nodo.
        """
        N = len(self.__nodos)
        for nodo in self.__nodos.values():
            id_nodo = nodo.get_id()
            suma = 0
            
            for id_n1 in self.__nodos:
                for id_n2 in self.__nodos:
                    if id_n1 != id_n2 and id_n1 != id_nodo and id_n2 != id_nodo:
                        caminos_n1_n2 = self.caminos_mas_cortos(id_n1, id_n2)
                        if caminos_n1_n2 > 0:
                            caminos_n1_nodo_n2 = self.caminos_mas_cortos_entre(id_n1, id_nodo, id_n2)
                            suma += (caminos_n1_nodo_n2 / caminos_n1_n2)
            interm_norm = float(2/(N-1)*(N-2))*suma
            nodo.set_intermediacion(interm_norm)
    
    def caminos_mas_cortos(self, id_n1, id_n2):
        """
        Cuenta el número de caminos más cortos entre dos nodos
        según el pseudocódigo.
        """
        if id_n1 == id_n2:
            return 1
        
        # Inicialización
        cola = [(id_n1, 0)]  # (nodo_actual, distancia)
        distancias = {id_nodo: float('inf') for id_nodo in self.__nodos}
        distancias[id_n1] = 0
        contador_caminos = {id_nodo: 0 for id_nodo in self.__nodos}
        contador_caminos[id_n1] = 1
        
        # BFS modificado para contar caminos
        while cola:
            nodo_actual, distancia = cola.pop(0)
            
            for vecino in [ady.get_id() for ady in self.__nodos[nodo_actual].get_adyacentes()]:
                if distancias[vecino] == float('inf'):
                    distancias[vecino] = distancia + 1
                    contador_caminos[vecino] = contador_caminos[nodo_actual]
                    cola.append((vecino, distancia + 1))
                elif distancias[vecino] == distancia + 1:
                    contador_caminos[vecino] += contador_caminos[nodo_actual]
        
        return contador_caminos[id_n2]
    
    def caminos_mas_cortos_entre(self, id_n1, id_nodo, id_n2):
        """
        Cuenta cuántos caminos más cortos entre n1 y n2 pasan por nodo,
        siguiendo el pseudocódigo.
        """
        caminos_n1_nodo = self.caminos_mas_cortos(id_n1, id_nodo)
        caminos_nodo_n2 = self.caminos_mas_cortos(id_nodo, id_n2)
        
        if caminos_n1_nodo == 0 or caminos_nodo_n2 == 0:
            return 0  # No hay conexión a través de nodo
        
        # Distancias para verificar si estamos en camino más corto
        dist_n1_n2 = self.distancia_geodesica_BFS(id_n1, id_n2)
        dist_n1_nodo = self.distancia_geodesica_BFS(id_n1, id_nodo)
        dist_nodo_n2 = self.distancia_geodesica_BFS(id_nodo, id_n2)
        
        # Solo consideramos los caminos donde nodo está en un camino más corto
        if dist_n1_nodo + dist_nodo_n2 == dist_n1_n2:
            return (caminos_n1_nodo * caminos_nodo_n2) / self.caminos_mas_cortos(id_n1, id_n2)
        else:
            return 0
    
    def calcular_pagerank(self, d=0.85, max_iter=100, tol=1e-6):
        """
        Calcula el PageRank usando una implementación iterativa
        y lo guarda en cada nodo.
        """
        N = len(self.__nodos)
        # Inicializar PageRank para todos los nodos
        pagerank = {nodo.get_id(): 1.0/N for nodo in self.__nodos.values()}
        
        # Iterar hasta convergencia o máximo de iteraciones
        for _ in range(max_iter):
            # Guardar valores anteriores
            pagerank_old = pagerank.copy()
            
            # Calcular nuevo PageRank para cada nodo
            for nodo in self.__nodos.values():
                suma = 0
                id_nodo = nodo.get_id()
                
                # Sumar contribuciones de nodos que apuntan a este
                for ady in [n for n in self.__nodos.values() if nodo in n.get_adyacentes()]:
                    id_ady = ady.get_id()
                    enlaces_salientes = ady.get_num_adyacentes()
                    if enlaces_salientes > 0:
                        suma += pagerank[id_ady] / enlaces_salientes
                
                # Actualizar PageRank
                pagerank[id_nodo] = (1 - d) / N + d * suma
            
            # Verificar convergencia
            convergencia = sum(abs(pagerank[id] - pagerank_old[id]) for id in pagerank)
            if convergencia < tol:
                break
        
        # Guardar valores finales en los nodos
        for nodo in self.__nodos.values():
            nodo.set_pagerank(pagerank[nodo.get_id()])
    
    def calcular_hits(self, num_iters=20):
        """
        Calcula los valores de HITS (Hub y Authority) siguiendo
        el pseudocódigo y los guarda en cada nodo.
        """
        # Inicialización
        for nodo in self.__nodos.values():
            nodo.set_auth(1.0)
            nodo.set_hub(1.0)
        
        # Iteraciones
        for _ in range(num_iters):
            # Actualizar Authority
            norm = 0
            for nodo in self.__nodos.values():
                nodo.set_auth(0)
                for ady in [n for n in self.__nodos.values() if nodo in n.get_adyacentes()]:
                    nodo.set_auth(nodo.get_auth() + ady.get_hub())
                norm += nodo.get_auth() ** 2
            
            # Normalizar Authority
            norm = math.sqrt(norm)
            if norm > 0:
                for nodo in self.__nodos.values():
                    nodo.set_auth(nodo.get_auth() / norm)
            
            # Actualizar Hub
            norm = 0
            for nodo in self.__nodos.values():
                nodo.set_hub(0)
                for ady in nodo.get_adyacentes():
                    nodo.set_hub(nodo.get_hub() + ady.get_auth())
                norm += nodo.get_hub() ** 2
            
            # Normalizar Hub
            norm = math.sqrt(norm)
            if norm > 0:
                for nodo in self.__nodos.values():
                    nodo.set_hub(nodo.get_hub() / norm)