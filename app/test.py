from models.Grafo import Grafo

def main():
    grafo = Grafo("uploads/nodes.csv", "uploads/edges.csv")
    grafo.calcular_centralidad()
    grafo.calcular_cercania()
    grafo.calcular_intermediacion()
    grafo.calcular_pagerank()
    grafo.calcular_hits()

if __name__ == "__main__":
    main()