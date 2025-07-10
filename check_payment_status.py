import sqlite3

def check_payment_status():
    try:
        conn = sqlite3.connect('mclassbookstore.db')
        cursor = conn.cursor()
        print("Successfully connected to mclassbookstore.db")

        # Check table schema
        cursor.execute("PRAGMA table_info(book)")
        schema = cursor.fetchall()
        print("\nSchema for 'book' table:")
        print([col[1] for col in schema])

        # Count payment status
        cursor.execute("SELECT checking, COUNT(*) FROM book GROUP BY checking")
        rows = cursor.fetchall()
        print("\nPayment status counts in mclassbookstore.db:")
        if not rows:
            print("No data found in 'book' table.")
        else:
            for row in rows:
                status = "Paid" if row[0] == 1 else "Unpaid" if row[0] == 0 else f"Unknown ({row[0]})"
                print(f"- {status}: {row[1]} books")

        # Show some sample data
        cursor.execute("SELECT book_name, price, checking, payment_date FROM book LIMIT 5")
        samples = cursor.fetchall()
        print("\nSample book data:")
        for sample in samples:
            print(sample)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_payment_status()
