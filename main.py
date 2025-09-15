#!/usr/bin/env python3
"""
Simple Python Application Template
A basic Python application demonstrating common patterns and functionality.
"""

import sys
import os


def greet_user(name="World"):
    """
    Greet a user with a personalized message.
    
    Args:
        name (str): The name of the user to greet
        
    Returns:
        str: A greeting message
    """
    return f"Hello, {name}!"


def calculate_fibonacci(n):
    """
    Calculate the nth Fibonacci number.
    
    Args:
        n (int): Position in the Fibonacci sequence
        
    Returns:
        int: The nth Fibonacci number
        
    Raises:
        ValueError: If n is negative
    """
    if n < 0:
        raise ValueError("Fibonacci number cannot be calculated for negative numbers")
    
    if n <= 1:
        return n
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    
    return b


def process_numbers(numbers):
    """
    Process a list of numbers and return statistics.
    
    Args:
        numbers (list): List of numbers to process
        
    Returns:
        dict: Dictionary containing statistics
    """
    if not numbers:
        return {"sum": 0, "average": 0, "min": None, "max": None, "count": 0}
    
    return {
        "sum": sum(numbers),
        "average": sum(numbers) / len(numbers),
        "min": min(numbers),
        "max": max(numbers),
        "count": len(numbers)
    }


def get_user_input():
    """
    Get input from the user with error handling.
    
    Returns:
        str: User input or empty string if error occurs
    """
    try:
        user_input = input("Enter your name (or press Enter for default): ").strip()
        return user_input if user_input else "World"
    except (EOFError, KeyboardInterrupt):
        print("\nInput cancelled by user.")
        return "World"


def demonstrate_file_operations():
    """
    Demonstrate basic file operations.
    """
    try:
        # Create a simple text file
        filename = "sample_output.txt"
        with open(filename, "w") as file:
            file.write("This is a sample output file.\n")
            file.write("Created by the Python application.\n")
        
        print(f"✓ Created file: {filename}")
        
        # Read the file back
        with open(filename, "r") as file:
            content = file.read()
            print(f"✓ File content:\n{content}")
        
        # Clean up
        os.remove(filename)
        print(f"✓ Cleaned up file: {filename}")
        
    except Exception as e:
        print(f"✗ File operation error: {e}")


def main():
    """
    Main function that demonstrates the application functionality.
    """
    print("=" * 50)
    print("     Simple Python Application Demo")
    print("=" * 50)
    
    # Demonstrate greeting function
    print("\n1. Greeting Demo:")
    name = get_user_input()
    greeting = greet_user(name)
    print(f"   {greeting}")
    
    # Demonstrate Fibonacci calculation
    print("\n2. Fibonacci Demo:")
    try:
        fib_number = calculate_fibonacci(10)
        print(f"   The 10th Fibonacci number is: {fib_number}")
    except ValueError as e:
        print(f"   Error: {e}")
    
    # Demonstrate number processing
    print("\n3. Number Processing Demo:")
    sample_numbers = [1, 5, 3, 9, 2, 8, 4, 7, 6]
    stats = process_numbers(sample_numbers)
    print(f"   Numbers: {sample_numbers}")
    print(f"   Statistics: {stats}")
    
    # Demonstrate file operations
    print("\n4. File Operations Demo:")
    demonstrate_file_operations()
    
    print("\n" + "=" * 50)
    print("     Application completed successfully!")
    print("=" * 50)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nApplication interrupted by user. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nUnexpected error occurred: {e}")
        sys.exit(1)