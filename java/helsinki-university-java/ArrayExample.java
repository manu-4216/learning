import java.util.Arrays;

public class ArrayExample {
  public static void main(String[] args) {
    // Creating
    int[] numbers = new int[3]; // array with length of 3 

    // Create + initialization
    int[] numbers2 = {100, 1, 42};

    // Create + initialization 2
    int[] numbers3 = new int[]{100, 1, 42};

    // Assign and access elements
    numbers[0] = 1;
    numbers[1] = 2;
    System.out.println(numbers[0]); // 1

    // length
    System.out.println(numbers.length); // 2

    // iterate - with while
    int index = 0;
    while (index < numbers.length) {
      System.out.println(numbers[index]);
      index = index + 1;
    }

    // iterate - with for
    for (int number : numbers) {
      System.out.println(number);
    }

    // iterate - with for
    for (int i = 0; i< numbers.length; i++) {
      System.out.println(numbers[i]);
    }

    // print
    Arrays.toString(numbers); // [1, 2]

    // sort
    Arrays.sort(numbers);

    System.out.println(numbers[99]); // ArrayIndexOutOfBoundsException error
  }
}
