public class Calculating {
  public static void main(String[] args) {
    // Addition
    System.out.println("Four: " + (2 + 2)); // 4
    System.out.println("But! Twenty-two: " + 2 + 2); // 22

    // Division
    int result = 3 / 2;
    System.out.println(result);  // 1 an integer, since 3 and 2 are integers

    // If the dividend or divisor (or both!) of the division is a floating point number, the result is a floating point number as well.
    double whenDividendIsFloat = 3.0 / 2;
    System.out.println(whenDividendIsFloat); // prints 1.5  

    // An integer can be converted into a floating point number by placing a type-casting operation (double) before it:
    int first = 3;
    int second = 2;
    int number = 7.2; // it will truncate the decimal part

    double result1 = (double) first / second;
    System.out.println(result1); // prints 1.5

    double result2 = first / (double) second;
    System.out.println(result2); // prints 1.5

    double result3 = (double) (first / second);
    System.out.println(result3); // prints 1.0, because the type-casting operation is done after the division
  }
}
