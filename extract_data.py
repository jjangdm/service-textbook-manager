import sqlite3
import json
import random

def extract_data(db_path, output_json_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    students_data = []
    books_data = []
    student_id_map = {}
    generated_codes = set()

    # Extract Students
    cursor.execute("SELECT id, name FROM student")
    for row in cursor.fetchall():
        old_id, name = row
        while True:
            student_code = str(random.randint(10000000, 99999999))
            if student_code not in generated_codes:
                generated_codes.add(student_code)
                break
        
        students_data.append({
            'old_id': old_id,
            'name': name,
            'student_code': student_code
        })
        student_id_map[old_id] = student_code

    # Extract Books
    cursor.execute("SELECT input_date, book_name, price, checking, student_id, payment_date FROM book")
    for row in cursor.fetchall():
        input_date, book_name, price, checking, student_id, payment_date = row
        books_data.append({
            'input_date': input_date,
            'book_name': book_name,
            'price': price,
            'checking': checking == 1,  # Explicitly check for 1
            'student_code': student_id_map.get(student_id),
            'payment_date': payment_date
        })

    conn.close()

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump({'students': students_data, 'books': books_data}, f, ensure_ascii=False, indent=4)

    print(f"Data extracted successfully to {output_json_path}")

if __name__ == "__main__":
    django_db_path = './mclassbookstore.db'
    output_json_path = './extracted_data.json'
    extract_data(django_db_path, output_json_path)