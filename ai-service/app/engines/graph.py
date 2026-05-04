from neo4j import GraphDatabase

class GraphEngine:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def get_related_products(self, user_id: str, top_k: int = 10):
        """
        Lấy danh sách product_id liên quan cho user dựa trên các cạnh SIMILAR hoặc sản phẩm user đã xem/mua.
        """
        query = """
        MATCH (u:User {id: $user_id})-[:VIEW|PURCHASE]->(p:Product)
        OPTIONAL MATCH (p)-[:SIMILAR]->(sim:Product)
        WITH COLLECT(DISTINCT p.id) + COLLECT(DISTINCT sim.id) AS product_ids
        UNWIND product_ids AS pid
        WITH pid WHERE pid IS NOT NULL
        RETURN pid AS product_id, count(*) AS score
        ORDER BY score DESC
        LIMIT $top_k
        """
        from app.settings import settings
        with self.driver.session(database=settings.NEO4J_DATABASE) as session:
            result = session.run(query, user_id=user_id, top_k=top_k)
            return [record["product_id"] for record in result]
