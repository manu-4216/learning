package exercices.BirdWatcher;

import java.util.ArrayList;
import java.util.Objects;


public class Observations {
    private ArrayList<Observation> observations;
    private Birds birds;
    
    public Observations(Birds birds) {
        this.observations = new ArrayList<>();
        this.birds = birds;
    }
    
    public ArrayList<Observation> getAll() {
        return this.observations;
    }
    
    public void add(String observedBird) {
        if (!birds.has(observedBird)) {
            // bird is unknown. Ignorethis observation
            return;
        }
        
        Observation existingObservationOfThisBird = this.findByName(observedBird);
        if (Objects.isNull(existingObservationOfThisBird)) {
            observations.add(new Observation(observedBird));
        } else {
            existingObservationOfThisBird.increment();
        }
    }
    
    public Observation findByName(String name) {
        for (Observation observation: observations) {
            if (observation.getName().equals(name)) {
                return observation;
            }
        }
        
        return null;
    }
    
    public int getCount(String name) {
        Observation observation = this.findByName(name);
        if (Objects.isNull(observation)) {
            return 0;
        }
        
        return observation.getCount();
    }
}

