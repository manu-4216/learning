// Double Assertion Signatures
const ageInYears = 'too old to count' as unknown as number;
ageInYears; // const ageInYears: number

// We should only convert a value's type to unknown if there is no other solution.
// It's much safer for us to convert to a type that is common between the two different types.
anchor as HTMLElement as HTMLButtonElement;
// ass SVGAnimatedPreserveAspectRatio
// sessionStorage
// AuthenticatorAttestationResponse
