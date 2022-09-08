import * from whitespace;

grammar {{
   start: "d"

   d -> a {{ data }}

   a -> b _ "&"  {{ data }}
      | b {{ data }}

   b -> letter {{ data }}
      | "(" _ d _ ")" {{ [ $0.value, $1, $2, $3, $4.value ] }}

   letter -> [a-z] {{ [ $0.value ] }}
}}

