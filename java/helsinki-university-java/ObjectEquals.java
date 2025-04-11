// The method equals is similar to the method toString in the respect that it is available for use even
// if it has not been defined in the class. The default implementation of this method compares the 
// equality of the references.

class Person {

  private String name;
  private int age;
  private int weight;
  private int height;

  // constructors and methods


  public boolean equals(Object compared) {
      // if the variables are located in the same position, they are equal
      if (this == compared) {
          return true;
      }

      // if the compared object is not of type Person, the objects are not equal
      if (!(compared instanceof Person)) {
          return false;
      }

      // convert the object into a Person object
      Person comparedPerson = (Person) compared;

      // if the values of the object variables are equal, the objects are equal
      if (this.name.equals(comparedPerson.name) &&
          this.age == comparedPerson.age &&
          this.weight == comparedPerson.weight &&
          this.height == comparedPerson.height) {
          return true;
      }

      // otherwise the objects are not equal
      return false;
  }

  // .. methods
}

// USAGE of equals
// Person leo = new Person("Leo", date, 62, 9);
// Person lily = new Person("Lily", date2, 65, 8);

// if (leo.equals(lily)) {
//     System.out.println("Is this quite correct?");
// }