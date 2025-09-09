class Nodo:
    def __init__(self, id, nombre):
        self.__id = str(id)  # Convertir a string para asegurar consistencia
        self.__nombre = nombre
        self.__adyacentes = set()
        # Atributos para métricas
        self.__centralidad = 0
        self.__cercania = 0
        self.__intermediacion = 0
        self.__pagerank = 0
        self.__auth = 0
        self.__hub = 0

    def agregar_adyacente(self, nodo):
        self.__adyacentes.add(nodo)
    
    def eliminar_adyacente(self, nodo):
        if nodo in self.__adyacentes:
            self.__adyacentes.remove(nodo)
    
    # Getters
    def get_id(self):
        return str(self.__id)  # Asegurar que siempre devuelve string
    
    def get_nombre(self):
        return self.__nombre
    
    def get_adyacentes(self):
        return self.__adyacentes
    
    def get_num_adyacentes(self):
        return len(self.__adyacentes)
    
    def get_centralidad(self):
        return self.__centralidad
    
    def get_cercania(self):
        return self.__cercania
    
    def get_intermediacion(self):
        return self.__intermediacion
    
    def get_pagerank(self):
        return self.__pagerank
    
    def get_auth(self):
        return self.__auth
    
    def get_hub(self):
        return self.__hub
    
    # Setters
    def set_nombre(self, nuevo_nombre):
        self.__nombre = nuevo_nombre
    
    def set_centralidad(self, centralidad):
        self.__centralidad = centralidad
    
    def set_cercania(self, cercania):
        self.__cercania = cercania
    
    def set_intermediacion(self, intermediacion):
        self.__intermediacion = intermediacion
    
    def set_pagerank(self, pagerank):
        self.__pagerank = pagerank
    
    def set_auth(self, auth):
        self.__auth = auth
    
    def set_hub(self, hub):
        self.__hub = hub
    
    # Para poder usar el nodo como clave en conjuntos y diccionarios
    def __hash__(self):
        return hash(self.__id)
    
    def __eq__(self, otro):
        if not isinstance(otro, Nodo):
            return False
        return self.__id == otro.get_id()
    
    def __str__(self):
        return f"Nodo(id={self.__id}, nombre={self.__nombre}, adyacentes={len(self.__adyacentes)})"


