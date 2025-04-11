public class StringsExample {
  public static void main(String[] args) {
    String s = "hi";

    // compare strings
    if (s.equals("")) {
      System.out.println("These are equal");
    }

    String s2;
    if (s2.equals("")) { // NullPointerException error, since s2 is not initialized a value
      // ...
    }

    // Split
    String s3 = "Hello world";
    String[] parts = s3.split(" ");
    System.out.println(parts[0]); // Hello
    System.out.println(parts[1]); // world

    // Contains
    if ("abcd".contains("ab")) {
      //..
    }

    // charAt
    "hello".charAt(2); // "l"

    // convert string to number
    int n = Integer.valueOf("12");

    // Length of string
    System.out.println(s.length());

    // using format
    String.format("Person [Name: %s, Age: %d]", "Alex", 21);

    // using positional params
    String.format("My name is %2$s, %1$s %2$s",  "James", "Bond");
  }
}
