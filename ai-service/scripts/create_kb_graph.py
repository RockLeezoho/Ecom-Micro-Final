import pandas as pd
from neo4j import GraphDatabase
NEO4J_URI = "neo4j://127.0.0.1:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "12345678"
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
# =====================================
# ĐỌC FILE CSV
# =====================================
user_df = pd.read_csv("../artifacts/data_user500.csv")
product_df = pd.read_csv("../artifacts/products.csv")

# =====================================
# MAP ACTION -> RELATIONSHIP
# =====================================
action_map = {
    "search": "SEARCH",
    "view_product": "VIEW",
    "stay_duration": "ENGAGED",
    "filter_sort": "FILTER_SORT",
    "wishlist_add": "WISHLIST",
    "add_to_cart": "ADD_TO_CART",
    "purchase": "PURCHASE",
    "remove_from_cart": "REMOVE_FROM_CART"
}

# =====================================
# TẠO CONSTRAINT
# =====================================
def create_constraints(tx):
    tx.run("""
        CREATE CONSTRAINT user_id IF NOT EXISTS
        FOR (u:User) REQUIRE u.id IS UNIQUE
    """)

    tx.run("""
        CREATE CONSTRAINT product_id IF NOT EXISTS
        FOR (p:Product) REQUIRE p.id IS UNIQUE
    """)

    tx.run("""
        CREATE CONSTRAINT category_name IF NOT EXISTS
        FOR (c:Category) REQUIRE c.name IS UNIQUE
    """)

# =====================================
# IMPORT PRODUCT NODE
# =====================================
def create_product(tx, row):
    query = """
    MERGE (p:Product {id:$product_id})
    SET p.name = $name,
        p.category = $category,
        p.subcategory = $subcategory,
        p.brand = $brand,
        p.origin = $origin,
        p.price = $price,
        p.stock = $stock,
        p.rating = $rating

    MERGE (c:Category {name:$category})
    MERGE (p)-[:BELONGS_TO]->(c)
    """

    tx.run(query,
        product_id=row["product_id"],
        name=row["name"],
        category=row["category"],
        subcategory=row["subcategory"],
        brand=row["brand"],
        origin=row["origin"],
        price=float(row["price"]),
        stock=int(row["stock"]),
        rating=float(row["rating"])
    )

# =====================================
# IMPORT USER ACTION EDGE
# =====================================
def create_user_action(tx, row):
    rel = action_map[row["action"]]

    query = f"""
    MERGE (u:User {{id:$user_id}})
    MERGE (p:Product {{id:$product_id}})
    MERGE (u)-[r:{rel}]->(p)
    SET r.time = $time
    """

    tx.run(query,
        user_id=row["user_id"],
        product_id=row["product_id"],
        time=str(row["timestamp"])
    )

# =====================================
# TẠO EDGE SIMILAR
# Cùng category hoặc cùng user view
# =====================================
def create_similar(tx):

    # Similar cùng category
    tx.run("""
    MATCH (p1:Product)-[:BELONGS_TO]->(c:Category)<-[:BELONGS_TO]-(p2:Product)
    WHERE p1.id < p2.id
    MERGE (p1)-[r:SIMILAR]->(p2)
    SET r.reason = "same_category",
        r.score = 0.6
    """)

    # Similar cùng user xem
    tx.run("""
    MATCH (u:User)-[:VIEW]->(p1:Product)
    MATCH (u)-[:VIEW]->(p2:Product)
    WHERE p1.id < p2.id
    WITH p1,p2,count(u) AS common_users
    WHERE common_users >= 3
    MERGE (p1)-[r:SIMILAR]->(p2)
    SET r.reason = "co_view",
        r.score = common_users
    """)

# =====================================
# MAIN
# =====================================
with driver.session(database="aiservicedb") as session:
    print("Tạo constraints...")
    session.execute_write(create_constraints)

    print("Import Product nodes...")
    for _, row in product_df.iterrows():
        session.execute_write(create_product, row)

    print("Import User + Action edges...")
    for _, row in user_df.iterrows():
        session.execute_write(create_user_action, row)

    print("Tạo SIMILAR edges...")
    session.execute_write(create_similar)

print("Import hoàn tất!")
driver.close()