import argparse
import os
import sys
from typing import Optional

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd
from neo4j import GraphDatabase

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

PRODUCTS_CSV = os.path.join(ARTIFACTS_DIR, "products.csv")
BEHAVIOR_CSV = os.path.join(ARTIFACTS_DIR, "data_user500.csv")

NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://5defd789.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USERNAME", "5defd789")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "HqeoAQQqlP2xzjICXWX4fOeuTG_cSPihGkIVTLkI8MY")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "5defd789")

ACTION_MAP = {
    "search": "SEARCH",
    "view_product": "VIEW",
    "stay_duration": "ENGAGED",
    "filter_sort": "FILTER_SORT",
    "wishlist_add": "WISHLIST",
    "add_to_cart": "ADD_TO_CART",
    "purchase": "PURCHASE",
    "remove_from_cart": "REMOVE_FROM_CART",
}


def to_int(value: Optional[object], default: int = 0) -> int:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    return int(value)


def to_float(value: Optional[object], default: float = 0.0) -> float:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    return float(value)


def create_constraints(tx):
    tx.run(
        """
        CREATE CONSTRAINT user_id IF NOT EXISTS
        FOR (u:User) REQUIRE u.id IS UNIQUE
        """
    )
    tx.run(
        """
        CREATE CONSTRAINT product_id IF NOT EXISTS
        FOR (p:Product) REQUIRE p.id IS UNIQUE
        """
    )
    tx.run(
        """
        CREATE CONSTRAINT category_name IF NOT EXISTS
        FOR (c:Category) REQUIRE c.name IS UNIQUE
        """
    )


def create_product(tx, row: pd.Series):
    query = """
    MERGE (p:Product {id: $product_id})
    SET p.name = $name,
        p.category = $category,
        p.product_type = $product_type,
        p.brand = $brand,
        p.origin = $origin,
        p.price = $price,
        p.stock = $stock,
        p.rating = $rating
    MERGE (c:Category {name: $category})
    MERGE (p)-[:BELONGS_TO]->(c)
    """

    tx.run(
        query,
        product_id=row.get("id"),
        name=row.get("name"),
        category=row.get("category"),
        product_type=row.get("product_type"),
        brand=row.get("brand"),
        origin=row.get("origin"),
        price=to_float(row.get("price")),
        stock=to_int(row.get("stock")),
        rating=to_float(row.get("rating")),
    )


def create_user_action(tx, row: pd.Series):
    action = row.get("action")
    rel = ACTION_MAP.get(action)
    if not rel:
        return

    query = f"""
    MERGE (u:User {{id: $user_id}})
    MERGE (p:Product {{id: $product_id}})
    MERGE (u)-[r:{rel}]->(p)
    SET r.time = $time
    """

    tx.run(
        query,
        user_id=row.get("user_id"),
        product_id=row.get("product_id"),
        time=str(row.get("timestamp")),
    )


def get_similar_queries():
    same_category = """
    MATCH (p1:Product)-[:BELONGS_TO]->(c:Category)<-[:BELONGS_TO]-(p2:Product)
    WHERE p1.id < p2.id
    CALL {
        WITH p1, p2
        MERGE (p1)-[r:SIMILAR]->(p2)
        SET r.reason = "same_category",
            r.score = 0.6
    } IN TRANSACTIONS OF 1000 ROWS
    """

    co_view = """
    MATCH (u:User)-[:VIEW]->(p1:Product)
    MATCH (u)-[:VIEW]->(p2:Product)
    WHERE p1.id < p2.id
    WITH p1, p2, count(u) AS common_users
    WHERE common_users >= 3
    CALL {
        WITH p1, p2, common_users
        MERGE (p1)-[r:SIMILAR]->(p2)
        SET r.reason = "co_view",
            r.score = common_users
    } IN TRANSACTIONS OF 1000 ROWS
    """

    return same_category, co_view


def clear_graph(tx):
    tx.run("MATCH (n) DETACH DELETE n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import products and behavior into Neo4j")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete all nodes before importing",
    )
    parser.add_argument(
        "--skip-similar",
        action="store_true",
        help="Skip SIMILAR edge generation to reduce memory usage",
    )
    args = parser.parse_args()

    if not os.path.exists(PRODUCTS_CSV):
        raise FileNotFoundError(f"Missing products CSV: {PRODUCTS_CSV}")
    if not os.path.exists(BEHAVIOR_CSV):
        raise FileNotFoundError(f"Missing behavior CSV: {BEHAVIOR_CSV}")

    products_df = pd.read_csv(PRODUCTS_CSV, encoding="utf-8-sig")
    behavior_df = pd.read_csv(BEHAVIOR_CSV)

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    try:
        with driver.session(database=NEO4J_DATABASE) as session:
            if args.reset:
                print("Clearing existing graph data...")
                session.execute_write(clear_graph)

            print("Creating constraints...")
            session.execute_write(create_constraints)

            print("Importing product nodes...")
            for _, row in products_df.iterrows():
                session.execute_write(create_product, row)

            print("Importing user behavior edges...")
            for _, row in behavior_df.iterrows():
                session.execute_write(create_user_action, row)

            if args.skip_similar:
                print("Skipping SIMILAR edge generation...")
            else:
                print("Creating SIMILAR edges...")
                for query in get_similar_queries():
                    session.run(query)

        print("Graph import completed.")
    finally:
        driver.close()


if __name__ == "__main__":
    main()
