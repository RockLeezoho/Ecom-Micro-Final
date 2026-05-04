# RAG pipeline logic
class RAGPipeline:
    def __init__(self, vector_engine, llm):
        self.vector_engine = vector_engine
        self.llm = llm

    def retrieve(self, query: str):
        return self.vector_engine.search(query)

    def generate(self, retrieved):
        # Dummy: join product ids as string
        return f"Gợi ý sản phẩm: {', '.join(map(str, retrieved))}"

    def run(self, query: str):
        retrieved = self.retrieve(query)
        return self.generate(retrieved)
