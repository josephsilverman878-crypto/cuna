// NYC neighborhood reference data for the "New to NY?" recommender.
//
// FAIR HOUSING — non-negotiable. Every description and highlight here describes
// the PLACE ONLY: streets, building stock, parks, transit, storefronts, noise.
// Never who lives somewhere, never safety or crime, never school quality, never
// a protected class, and never market-coded language ("up-and-coming",
// "desirable", "exclusive"). The numeric scores rate the place on those same
// terms. If you add a neighborhood, re-run the fair housing scan before
// committing: scanDescription() from ./fairHousing plus a grep for the banned
// vocabulary above.
//
// ACCURACY — rents, sale prices and commute times are rough estimates for broker
// review, deliberately kept as wide ranges rather than false precision. Values
// marked // REVIEW are the least certain and should be checked first.

const DATA_NOTE = 'Estimates; verify current market conditions'

// The scored fields, for building quiz questions and comparison UI.
// `on: 'scores'` lives under neighborhood.scores; `on: 'root'` is a top-level key.
export const DIMENSIONS = [
  {
    key: 'pace',
    label: 'Pace',
    on: 'scores',
    low: 'Quiet streets, little activity after dark',
    high: 'Busy sidewalks and street noise late into the night',
  },
  {
    key: 'nightlife',
    label: 'Nightlife',
    on: 'scores',
    low: 'Few bars or venues',
    high: 'Dense run of bars, clubs and music venues',
  },
  {
    key: 'dining',
    label: 'Dining',
    on: 'scores',
    low: 'Limited restaurant options',
    high: 'Multiple dense restaurant corridors',
  },
  {
    key: 'green_space',
    label: 'Green space',
    on: 'scores',
    low: 'Little park access within walking distance',
    high: 'Large park at the edge of the neighborhood',
  },
  {
    key: 'walkability',
    label: 'Walkability',
    on: 'scores',
    low: 'Most errands need transit or a car',
    high: 'Groceries and daily errands on foot',
  },
  {
    key: 'transit_access',
    label: 'Transit access',
    on: 'scores',
    low: 'One line, or a long walk to the nearest station',
    high: 'Many lines converging, frequent service',
  },
  {
    key: 'car_friendly',
    label: 'Car ownership',
    on: 'root',
    low: 'Street parking is very difficult, garages are costly',
    high: 'Street parking is usually findable, driveways exist',
  },
]

export const NEIGHBORHOODS = [
  // ---------------------------------------------------------------- Brooklyn
  {
    id: 'park-slope',
    name: 'Park Slope',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 3, dining: 4, green_space: 5, walkability: 5, transit_access: 4 },
    car_friendly: 2,
    housing_stock: ['brownstone_rowhouse', 'prewar', 'walkup', 'coop', 'condo', 'two_three_family'],
    rent_ranges: {
      studio: { min: 2200, max: 3000 },
      one_bed: { min: 2800, max: 3800 },
      two_bed: { min: 3800, max: 5500 },
    },
    sale_ranges: {
      condo: { min: 900000, max: 2000000 },
      coop: { min: 600000, max: 1400000 },
      townhouse_multifamily: { min: 2500000, max: 6000000 },
    },
    subway_lines: ['F', 'G', 'R', '2', '3', 'B', 'Q'],
    commute_minutes: { midtown: 35, downtown_fidi: 30 },
    description:
      'Brownstone and limestone row houses line the side streets between Prospect Park West and Fourth Avenue, most three to four stories with garden-level entrances. Fifth and Seventh Avenues carry the retail — restaurants, bakeries, bookshops, hardware stores — while Fourth Avenue has taller elevator buildings added since the 2003 rezoning. Prospect Park runs the entire eastern edge.',
    highlights: [
      'Prospect Park along the full eastern boundary',
      'Two retail corridors: Fifth Avenue and Seventh Avenue',
      'Mostly three- and four-story row houses on side streets',
      'F, G and R trains, plus 2/3 at Grand Army Plaza',
      'Year-round Saturday greenmarket at Grand Army Plaza',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'carroll-gardens',
    name: 'Carroll Gardens',
    borough: 'Brooklyn',
    scores: { pace: 2, nightlife: 3, dining: 4, green_space: 3, walkability: 5, transit_access: 3 },
    car_friendly: 3,
    housing_stock: ['brownstone_rowhouse', 'prewar', 'two_three_family', 'walkup', 'condo'],
    rent_ranges: {
      studio: { min: 2200, max: 2900 },
      one_bed: { min: 2900, max: 3900 },
      two_bed: { min: 3800, max: 5200 },
    },
    sale_ranges: {
      condo: { min: 900000, max: 1800000 },
      coop: { min: 550000, max: 1100000 },
      townhouse_multifamily: { min: 2200000, max: 5000000 },
    },
    subway_lines: ['F', 'G'],
    commute_minutes: { midtown: 35, downtown_fidi: 25 },
    description:
      'Named for the unusually deep front gardens on Carroll, President and First Streets, where the row houses sit roughly thirty feet back from the sidewalk. Court Street and Smith Street run parallel as the commercial spines, with restaurants, bakeries and small storefronts at ground level. Most buildings are three-story brick and brownstone row houses, many still configured as two- or three-family.',
    highlights: [
      'Deep front gardens set the row houses back from the street',
      'Court Street and Smith Street are the two retail strips',
      'Carroll Park, with ball courts, sits at the center',
      'F and G trains at Carroll Street and Bergen Street',
      'Low-rise throughout: almost nothing above four stories',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'cobble-hill',
    name: 'Cobble Hill',
    borough: 'Brooklyn',
    scores: { pace: 2, nightlife: 2, dining: 4, green_space: 2, walkability: 5, transit_access: 4 },
    car_friendly: 3,
    housing_stock: ['brownstone_rowhouse', 'prewar', 'walkup', 'coop', 'condo'],
    rent_ranges: {
      studio: { min: 2300, max: 3000 },
      one_bed: { min: 3000, max: 4000 },
      two_bed: { min: 4000, max: 5500 },
    },
    sale_ranges: {
      condo: { min: 900000, max: 2000000 },
      coop: { min: 600000, max: 1200000 },
      townhouse_multifamily: { min: 2500000, max: 5500000 },
    },
    subway_lines: ['F', 'G', 'R', '2', '3', '4', '5'],
    commute_minutes: { midtown: 32, downtown_fidi: 22 },
    description:
      'A compact grid of brick and brownstone row houses between Atlantic Avenue and Degraw Street, most three to four stories inside a historic district. Court Street carries groceries, cafés and restaurants, while Atlantic Avenue along the northern edge holds furniture showrooms and antique dealers. Cobble Hill Park, a small gated green off Congress Street, is the main open space.',
    highlights: [
      'Historic district covering most of the residential blocks',
      'Court Street for daily errands, Atlantic Avenue for furniture and antiques',
      'Cobble Hill Park is the only sizable green space',
      'F and G at Bergen Street; Borough Hall lines a short walk north',
      'Walkable to Brooklyn Bridge Park in about fifteen minutes',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'brooklyn-heights',
    name: 'Brooklyn Heights',
    borough: 'Brooklyn',
    scores: { pace: 2, nightlife: 2, dining: 3, green_space: 4, walkability: 5, transit_access: 5 },
    car_friendly: 2,
    housing_stock: ['brownstone_rowhouse', 'prewar', 'coop', 'condo', 'elevator_building', 'townhouse'],
    rent_ranges: {
      studio: { min: 2400, max: 3200 },
      one_bed: { min: 3200, max: 4500 },
      two_bed: { min: 4500, max: 6500 },
    },
    sale_ranges: {
      condo: { min: 950000, max: 2500000 },
      coop: { min: 600000, max: 1500000 },
      townhouse_multifamily: { min: 3000000, max: 8000000 },
    },
    subway_lines: ['2', '3', '4', '5', 'R', 'A', 'C', 'F'],
    commute_minutes: { midtown: 28, downtown_fidi: 18 },
    description:
      'The Promenade cantilevers over the BQE with an open view of the harbor and Lower Manhattan. Behind it, Willow, Cranberry and Hicks Streets hold some of the oldest wood-frame and Greek Revival row houses in the city, inside a historic district designated in 1965. Montague Street is the commercial spine, and Brooklyn Bridge Park runs along the waterfront below the bluff.',
    highlights: [
      'Promenade with an unobstructed harbor and skyline view',
      'Historic district designated in 1965, the first in New York City',
      'Brooklyn Bridge Park at the base of the bluff',
      'Eight subway lines across Borough Hall, Clark Street and High Street',
      'Montague Street is the main retail corridor',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'williamsburg',
    name: 'Williamsburg',
    borough: 'Brooklyn',
    scores: { pace: 5, nightlife: 5, dining: 5, green_space: 3, walkability: 5, transit_access: 4 },
    car_friendly: 2,
    housing_stock: ['new_construction', 'condo', 'walkup', 'elevator_building', 'two_three_family', 'prewar'],
    rent_ranges: {
      studio: { min: 2800, max: 3800 },
      one_bed: { min: 3500, max: 4800 },
      two_bed: { min: 4500, max: 7000 },
    },
    sale_ranges: {
      condo: { min: 950000, max: 2500000 },
      coop: { min: 500000, max: 900000 }, // REVIEW — co-ops are a small slice of this market
      townhouse_multifamily: { min: 2000000, max: 4500000 },
    },
    subway_lines: ['L', 'G', 'J', 'M', 'Z'],
    commute_minutes: { midtown: 30, downtown_fidi: 30 },
    description:
      'Bedford Avenue and the streets around it carry a dense run of restaurants, bars, music venues and storefronts, busy well past midnight. The waterfront north of Grand Street has glass towers facing the East River, while blocks further inland are low-rise brick walk-ups and converted industrial buildings. Domino Park runs along the water on the site of the former sugar refinery.',
    highlights: [
      'Domino Park and the East River waterfront esplanade',
      'Bedford Avenue is the main commercial spine, active late',
      'L train to Manhattan in one stop from Bedford Avenue',
      'East River Ferry stops at North 6th Street',
      'Mix of new waterfront towers and low-rise brick walk-ups',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'greenpoint',
    name: 'Greenpoint',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 4, dining: 4, green_space: 3, walkability: 4, transit_access: 3 },
    car_friendly: 3,
    housing_stock: ['two_three_family', 'walkup', 'new_construction', 'condo', 'prewar'],
    rent_ranges: {
      studio: { min: 2500, max: 3200 },
      one_bed: { min: 3000, max: 4200 },
      two_bed: { min: 4000, max: 5800 },
    },
    sale_ranges: {
      condo: { min: 800000, max: 1800000 },
      coop: { min: 450000, max: 850000 },
      townhouse_multifamily: { min: 1500000, max: 3500000 },
    },
    subway_lines: ['G', 'L'],
    commute_minutes: { midtown: 35, downtown_fidi: 40 },
    description:
      'Manhattan Avenue is the main commercial street, with Franklin Street running parallel closer to the water and lined with smaller storefronts and restaurants. Housing is largely two- and three-family frame and brick houses, with newer elevator buildings clustered along the waterfront. WNYC Transmitter Park and the northern half of McCarren Park provide the green space.',
    highlights: [
      'WNYC Transmitter Park with a pier facing the Manhattan skyline',
      'Manhattan Avenue and Franklin Street are the two retail runs',
      'G train only within the neighborhood; L at Nassau Avenue edge',
      'East River Ferry at India Street',
      'Mostly two- and three-family frame and brick houses',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'bushwick',
    name: 'Bushwick',
    borough: 'Brooklyn',
    scores: { pace: 4, nightlife: 5, dining: 4, green_space: 2, walkability: 4, transit_access: 4 },
    car_friendly: 3,
    housing_stock: ['two_three_family', 'walkup', 'new_construction', 'condo'],
    rent_ranges: {
      studio: { min: 2000, max: 2600 },
      one_bed: { min: 2400, max: 3200 },
      two_bed: { min: 2900, max: 4200 },
    },
    sale_ranges: {
      condo: { min: 600000, max: 1100000 },
      coop: null, // REVIEW — co-ops are rare here; confirm before showing a range
      townhouse_multifamily: { min: 1200000, max: 2500000 },
    },
    subway_lines: ['L', 'J', 'M', 'Z'],
    commute_minutes: { midtown: 40, downtown_fidi: 40 },
    description:
      'Low-rise brick and frame buildings sit alongside former warehouses and factories, many converted to apartments or ground-floor commercial space. Wyckoff Avenue, Knickerbocker Avenue and the blocks near Jefferson Street hold restaurants, bars and music venues, with large-scale murals covering many industrial walls. Maria Hernandez Park is the main open space.',
    highlights: [
      'Converted warehouse and factory buildings throughout',
      'Large-scale outdoor murals concentrated near Troutman Street',
      'L, J, M and Z trains all serve the neighborhood',
      'Maria Hernandez Park is the main green space',
      'Bar and music venue density concentrated near Jefferson Street',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'bed-stuy',
    name: 'Bedford-Stuyvesant',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 3, dining: 3, green_space: 2, walkability: 4, transit_access: 4 },
    car_friendly: 3,
    housing_stock: ['brownstone_rowhouse', 'two_three_family', 'prewar', 'walkup', 'condo'],
    rent_ranges: {
      studio: { min: 1900, max: 2500 },
      one_bed: { min: 2400, max: 3200 },
      two_bed: { min: 3000, max: 4200 },
    },
    sale_ranges: {
      condo: { min: 650000, max: 1200000 },
      coop: null, // REVIEW — very limited co-op stock
      townhouse_multifamily: { min: 1300000, max: 2800000 },
    },
    subway_lines: ['A', 'C', 'G', 'J', 'M', 'Z'],
    commute_minutes: { midtown: 40, downtown_fidi: 35 },
    description:
      'One of the largest concentrations of intact brownstone and limestone row houses in the city, with the Stuyvesant Heights and Bedford historic districts covering dozens of blocks. Fulton Street, Nostrand Avenue and Tompkins Avenue carry the retail, and many houses remain configured as two- or three-family. Herbert Von King Park and Saratoga Park are the neighborhood greens.',
    highlights: [
      'Extensive intact brownstone and limestone row house blocks',
      'Two historic districts: Stuyvesant Heights and Bedford',
      'Fulton Street and Nostrand Avenue are the main retail corridors',
      'A, C, G, J, M and Z trains across the neighborhood',
      'Herbert Von King Park has an amphitheater and playgrounds',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'crown-heights',
    name: 'Crown Heights',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 3, dining: 3, green_space: 4, walkability: 4, transit_access: 4 },
    car_friendly: 3,
    housing_stock: ['prewar', 'brownstone_rowhouse', 'walkup', 'coop', 'condo', 'two_three_family'],
    rent_ranges: {
      studio: { min: 1900, max: 2500 },
      one_bed: { min: 2300, max: 3100 },
      two_bed: { min: 2900, max: 4000 },
    },
    sale_ranges: {
      condo: { min: 600000, max: 1100000 },
      coop: { min: 350000, max: 700000 },
      townhouse_multifamily: { min: 1200000, max: 2500000 },
    },
    subway_lines: ['2', '3', '4', '5', 'A', 'C', 'S'],
    commute_minutes: { midtown: 40, downtown_fidi: 35 },
    description:
      'Eastern Parkway, a six-lane boulevard with landscaped malls and service roads, runs the length of the neighborhood lined with prewar apartment buildings. The Brooklyn Museum, the Brooklyn Botanic Garden and the Central Library sit at its western end beside Prospect Park. Franklin and Nostrand Avenues carry restaurants and storefronts, and the side streets hold limestone and brownstone rows.',
    highlights: [
      'Eastern Parkway, the first landscaped parkway built in the US',
      'Brooklyn Museum and Brooklyn Botanic Garden at the western end',
      'Prospect Park within walking distance of the western blocks',
      'Franklin Avenue is the densest restaurant strip',
      'Prewar elevator buildings along the parkway, row houses behind',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'prospect-heights',
    name: 'Prospect Heights',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 4, dining: 5, green_space: 5, walkability: 5, transit_access: 5 },
    car_friendly: 2,
    housing_stock: ['brownstone_rowhouse', 'prewar', 'walkup', 'coop', 'condo', 'new_construction'],
    rent_ranges: {
      studio: { min: 2200, max: 2900 },
      one_bed: { min: 2800, max: 3800 },
      two_bed: { min: 3600, max: 5000 },
    },
    sale_ranges: {
      condo: { min: 800000, max: 1600000 },
      coop: { min: 500000, max: 950000 },
      townhouse_multifamily: { min: 1800000, max: 3800000 },
    },
    subway_lines: ['2', '3', '4', '5', 'B', 'Q', 'D', 'N', 'R', 'S'],
    commute_minutes: { midtown: 35, downtown_fidi: 30 },
    description:
      'A small triangle of blocks between Flatbush, Atlantic and Washington Avenues, densely built with three- and four-story row houses. Vanderbilt Avenue is the restaurant corridor, with a shorter second strip on Washington Avenue. Prospect Park, the Brooklyn Botanic Garden and the Brooklyn Museum all sit within a few blocks, and Barclays Center caps the northern tip above the Atlantic Terminal transit hub.',
    highlights: [
      'Ten subway lines at Atlantic Avenue–Barclays Center',
      'Vanderbilt Avenue restaurant corridor',
      'Prospect Park and the Botanic Garden within a few blocks',
      'Compact: walkable end to end in about fifteen minutes',
      'Mostly three- and four-story row houses',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'fort-greene',
    name: 'Fort Greene',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 4, dining: 4, green_space: 4, walkability: 5, transit_access: 5 },
    car_friendly: 2,
    housing_stock: ['brownstone_rowhouse', 'prewar', 'coop', 'condo', 'elevator_building', 'walkup'],
    rent_ranges: {
      studio: { min: 2300, max: 3000 },
      one_bed: { min: 2900, max: 3900 },
      two_bed: { min: 3800, max: 5200 },
    },
    sale_ranges: {
      condo: { min: 850000, max: 1800000 },
      coop: { min: 500000, max: 1000000 },
      townhouse_multifamily: { min: 2000000, max: 4500000 },
    },
    subway_lines: ['B', 'D', 'N', 'Q', 'R', '2', '3', '4', '5', 'G', 'C'],
    commute_minutes: { midtown: 30, downtown_fidi: 25 },
    description:
      'Fort Greene Park, thirty acres on a hill topped by the Prison Ship Martyrs Monument, anchors the neighborhood. DeKalb Avenue and Myrtle Avenue carry the restaurants and shops, and the Brooklyn Academy of Music and Mark Morris Dance Center sit at the western edge. Housing is mostly brownstone and brick row houses, with taller buildings along Flatbush Avenue Extension.',
    highlights: [
      'Fort Greene Park, thirty acres designed by Olmsted and Vaux',
      'BAM and the Mark Morris Dance Center at the western edge',
      'DeKalb Avenue restaurant strip',
      'Eleven subway lines within a short walk',
      'Greenmarket in the park on Saturdays',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'clinton-hill',
    name: 'Clinton Hill',
    borough: 'Brooklyn',
    scores: { pace: 2, nightlife: 3, dining: 4, green_space: 3, walkability: 4, transit_access: 4 },
    car_friendly: 3,
    housing_stock: ['brownstone_rowhouse', 'prewar', 'townhouse', 'coop', 'condo', 'walkup'],
    rent_ranges: {
      studio: { min: 2100, max: 2800 },
      one_bed: { min: 2700, max: 3600 },
      two_bed: { min: 3400, max: 4800 },
    },
    sale_ranges: {
      condo: { min: 700000, max: 1400000 },
      coop: { min: 450000, max: 850000 },
      townhouse_multifamily: { min: 1600000, max: 3500000 },
    },
    subway_lines: ['G', 'C', 'A'],
    commute_minutes: { midtown: 35, downtown_fidi: 30 },
    description:
      'Clinton and Washington Avenues hold a run of freestanding nineteenth-century mansions, several now institutional, with brownstone row houses on the cross streets. The Pratt Institute campus occupies a landscaped superblock whose outdoor sculpture collection is open to the public. Myrtle Avenue and DeKalb Avenue carry the retail.',
    highlights: [
      'Freestanding nineteenth-century mansions on Clinton Avenue',
      'Pratt Institute campus with a public outdoor sculpture collection',
      'Myrtle Avenue and DeKalb Avenue retail strips',
      'G train at Classon and Clinton–Washington; C at Clinton–Washington',
      'Lower-rise and quieter than neighboring Fort Greene',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'bay-ridge',
    name: 'Bay Ridge',
    borough: 'Brooklyn',
    scores: { pace: 2, nightlife: 3, dining: 4, green_space: 4, walkability: 4, transit_access: 2 },
    car_friendly: 4,
    housing_stock: ['two_three_family', 'townhouse', 'prewar', 'postwar', 'coop', 'elevator_building'],
    rent_ranges: {
      studio: { min: 1600, max: 2100 },
      one_bed: { min: 2000, max: 2700 },
      two_bed: { min: 2500, max: 3500 },
    },
    sale_ranges: {
      condo: { min: 450000, max: 900000 },
      coop: { min: 250000, max: 550000 },
      townhouse_multifamily: { min: 900000, max: 1800000 },
    },
    subway_lines: ['R'],
    commute_minutes: { midtown: 55, downtown_fidi: 45 }, // REVIEW — R train only; express bus differs
    description:
      'Shore Road runs along the water beneath the Verrazzano-Narrows Bridge, with a linear park and bike path facing the Narrows. Third Avenue and Fifth Avenue are the retail spines, each running more than twenty blocks of restaurants and storefronts. Housing is a mix of limestone row houses, freestanding houses on the numbered streets, and prewar and postwar elevator buildings.',
    highlights: [
      'Shore Road Park and the waterfront bike path under the bridge',
      'Two long retail corridors: Third Avenue and Fifth Avenue',
      'Freestanding houses with driveways on the numbered streets',
      'R train is the only subway line; express buses to Manhattan',
      'Owl\'s Head Park at the northern end',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'sunset-park',
    name: 'Sunset Park',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 2, dining: 4, green_space: 4, walkability: 4, transit_access: 3 },
    car_friendly: 3,
    housing_stock: ['two_three_family', 'walkup', 'prewar', 'townhouse', 'condo'],
    rent_ranges: {
      studio: { min: 1600, max: 2100 },
      one_bed: { min: 1900, max: 2600 },
      two_bed: { min: 2400, max: 3300 },
    },
    sale_ranges: {
      condo: { min: 500000, max: 950000 }, // REVIEW — thin condo market, few comparables
      coop: { min: 300000, max: 600000 },
      townhouse_multifamily: { min: 900000, max: 1700000 },
    },
    subway_lines: ['R', 'D', 'N'],
    commute_minutes: { midtown: 45, downtown_fidi: 35 },
    description:
      'The park the neighborhood is named for sits on a hill with a direct view of the harbor and the Manhattan skyline. Fifth Avenue and Eighth Avenue are two separate commercial corridors, each running roughly twenty blocks of storefronts, groceries and restaurants. Industry City and Bush Terminal occupy the waterfront as large complexes of converted industrial buildings, and Green-Wood Cemetery forms the northern boundary.',
    highlights: [
      'Hilltop park with an unobstructed harbor and skyline view',
      'Two long, separate retail corridors on Fifth and Eighth Avenues',
      'Industry City: converted industrial complex with food and retail',
      'Green-Wood Cemetery, 478 acres, along the northern edge',
      'Mostly two- and three-family houses and small walk-ups',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'flatbush-ditmas-park',
    name: 'Flatbush / Ditmas Park',
    borough: 'Brooklyn',
    scores: { pace: 2, nightlife: 2, dining: 3, green_space: 4, walkability: 3, transit_access: 3 },
    car_friendly: 4,
    housing_stock: ['townhouse', 'two_three_family', 'prewar', 'coop', 'walkup', 'elevator_building'],
    rent_ranges: {
      studio: { min: 1600, max: 2100 },
      one_bed: { min: 2000, max: 2700 },
      two_bed: { min: 2500, max: 3500 },
    },
    sale_ranges: {
      condo: { min: 400000, max: 800000 },
      coop: { min: 250000, max: 550000 },
      townhouse_multifamily: { min: 900000, max: 2000000 }, // REVIEW — freestanding Victorians span a much wider range
    },
    subway_lines: ['Q', 'B', '2', '5'],
    commute_minutes: { midtown: 50, downtown_fidi: 45 },
    description:
      'Ditmas Park and the blocks around it hold several hundred freestanding Victorian houses with wraparound porches, driveways and yards, a housing type rare elsewhere in the city. Cortelyou Road and Newkirk Avenue carry the retail, and Newkirk Plaza is a sunken open-air shopping arcade built over the subway cut. North and east of the Victorian blocks the stock shifts to prewar apartment buildings along Ocean and Flatbush Avenues.',
    highlights: [
      'Several hundred freestanding Victorian houses with porches and yards',
      'Driveways and garages are common, unusual for Brooklyn',
      'Newkirk Plaza, a sunken open-air arcade over the tracks',
      'Cortelyou Road is the main retail strip',
      'Q and B express service from Newkirk Plaza',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'dumbo',
    name: 'DUMBO',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 3, dining: 4, green_space: 4, walkability: 4, transit_access: 3 },
    car_friendly: 2,
    housing_stock: ['new_construction', 'condo', 'elevator_building', 'prewar'],
    rent_ranges: {
      studio: { min: 3000, max: 4000 },
      one_bed: { min: 3800, max: 5200 },
      two_bed: { min: 5000, max: 8000 },
    },
    sale_ranges: {
      condo: { min: 1000000, max: 3000000 },
      coop: null, // REVIEW — effectively no co-op stock
      townhouse_multifamily: null, // REVIEW — effectively no row house stock
    },
    subway_lines: ['F', 'A', 'C'],
    commute_minutes: { midtown: 30, downtown_fidi: 20 },
    description:
      'Belgian block streets run between converted nineteenth-century warehouses under the Manhattan and Brooklyn Bridge approaches. Brooklyn Bridge Park extends along the waterfront with piers, lawns and a restored 1922 carousel in a glass pavilion. Most residential buildings are loft conversions or newer towers, with ground-floor retail concentrated on Front and Water Streets.',
    highlights: [
      'Brooklyn Bridge Park piers, lawns and sports fields',
      'Converted nineteenth-century warehouse lofts',
      'Belgian block (cobblestone) streets throughout the core',
      'East River Ferry and NYC Ferry at Fulton Landing',
      'Mostly loft conversions and newer towers; almost no row houses',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'gowanus',
    name: 'Gowanus',
    borough: 'Brooklyn',
    scores: { pace: 3, nightlife: 4, dining: 4, green_space: 2, walkability: 4, transit_access: 4 },
    car_friendly: 3,
    housing_stock: ['new_construction', 'condo', 'brownstone_rowhouse', 'walkup', 'two_three_family'],
    rent_ranges: {
      studio: { min: 2300, max: 3000 },
      one_bed: { min: 2900, max: 3900 },
      two_bed: { min: 3800, max: 5200 },
    },
    sale_ranges: {
      condo: { min: 800000, max: 1600000 },
      coop: null, // REVIEW — very limited co-op stock
      townhouse_multifamily: { min: 1500000, max: 3000000 },
    },
    subway_lines: ['F', 'G', 'R'],
    commute_minutes: { midtown: 35, downtown_fidi: 28 },
    description:
      'The Gowanus Canal, a 1.8-mile industrial waterway under federal Superfund remediation, runs through the middle of the neighborhood. Low-rise warehouses and light-industrial buildings sit beside newer elevator buildings added after the 2021 rezoning, with bars, restaurants and event spaces along Third Avenue and Union Street. The blocks west of the canal hold brick row houses.',
    highlights: [
      'Gowanus Canal with pedestrian bridges at Carroll and Union Streets',
      'Mix of working light industry and new elevator buildings',
      'Third Avenue and Union Street carry the bars and restaurants',
      'F, G and R trains at Fourth Avenue–Ninth Street and Union Street',
      'Low-rise: sightlines are open compared to neighboring areas',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'downtown-brooklyn',
    name: 'Downtown Brooklyn',
    borough: 'Brooklyn',
    scores: { pace: 4, nightlife: 3, dining: 3, green_space: 2, walkability: 4, transit_access: 5 },
    car_friendly: 2,
    housing_stock: ['new_construction', 'elevator_building', 'condo', 'coop'],
    rent_ranges: {
      studio: { min: 2800, max: 3600 },
      one_bed: { min: 3400, max: 4500 },
      two_bed: { min: 4500, max: 6500 },
    },
    sale_ranges: {
      condo: { min: 800000, max: 1800000 },
      coop: { min: 400000, max: 750000 },
      townhouse_multifamily: null, // REVIEW — effectively no row house stock in the core
    },
    subway_lines: ['A', 'C', 'F', 'R', '2', '3', '4', '5', 'B', 'Q', 'D', 'N', 'G'],
    commute_minutes: { midtown: 28, downtown_fidi: 20 },
    description:
      'High-rise residential towers built over the last two decades surround the Fulton Street pedestrian mall and the MetroTech campus. Thirteen subway lines converge across Jay Street–MetroTech, Borough Hall, Hoyt–Schermerhorn and DeKalb Avenue, one of the densest transit concentrations outside Midtown. City Point holds a food hall and cinema, and several institutional campuses break up the tower blocks.',
    highlights: [
      'Thirteen subway lines across four adjacent stations',
      'Fulton Street pedestrian mall, closed to through traffic',
      'Almost entirely high-rise elevator buildings',
      'City Point food hall and cinema',
      'Brooklyn Bridge Park and Fort Greene Park both a short walk',
    ],
    data_note: DATA_NOTE,
  },

  // --------------------------------------------------------------- Manhattan
  {
    id: 'east-village',
    name: 'East Village',
    borough: 'Manhattan',
    scores: { pace: 5, nightlife: 5, dining: 5, green_space: 2, walkability: 5, transit_access: 3 },
    car_friendly: 1,
    housing_stock: ['walkup', 'prewar', 'coop', 'condo', 'elevator_building'],
    rent_ranges: {
      studio: { min: 2600, max: 3400 },
      one_bed: { min: 3200, max: 4500 },
      two_bed: { min: 4500, max: 6500 },
    },
    sale_ranges: {
      condo: { min: 900000, max: 2000000 },
      coop: { min: 500000, max: 1100000 },
      townhouse_multifamily: { min: 3000000, max: 7000000 },
    },
    subway_lines: ['L', '6', 'F', 'M', 'N', 'Q', 'R', 'W'],
    commute_minutes: { midtown: 20, downtown_fidi: 20 },
    description:
      'Late nineteenth-century tenement walk-ups fill most blocks, with storefronts at ground level on nearly every avenue. St. Marks Place and Avenues A and B carry a dense run of bars, restaurants and music venues open late. Tompkins Square Park, ten and a half acres with a dog run and elm-shaded center, is the main open space.',
    highlights: [
      'Tompkins Square Park with one of the city\'s oldest dog runs',
      'Five- and six-story walk-ups on nearly every block',
      'Restaurant and bar density along First Avenue and Avenue A',
      'Street noise runs late, especially near St. Marks Place',
      'L at First Avenue; 6 at Astor Place; F at Second Avenue',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'west-village',
    name: 'West Village',
    borough: 'Manhattan',
    scores: { pace: 3, nightlife: 4, dining: 5, green_space: 3, walkability: 5, transit_access: 4 },
    car_friendly: 1,
    housing_stock: ['brownstone_rowhouse', 'townhouse', 'walkup', 'prewar', 'coop', 'condo'],
    rent_ranges: {
      studio: { min: 3000, max: 4000 },
      one_bed: { min: 4000, max: 5500 },
      two_bed: { min: 5500, max: 9000 },
    },
    sale_ranges: {
      condo: { min: 1300000, max: 3500000 },
      coop: { min: 750000, max: 1800000 },
      townhouse_multifamily: { min: 5000000, max: 15000000 },
    },
    subway_lines: ['1', '2', '3', 'A', 'C', 'E', 'B', 'D', 'F', 'M', 'L'],
    commute_minutes: { midtown: 18, downtown_fidi: 20 },
    description:
      'The street grid breaks here — West Fourth Street crosses West Tenth and West Eleventh, following colonial-era property lines rather than the 1811 plan. Low-rise brick Federal and Greek Revival row houses line Bedford, Grove and Charles Streets, with restaurants and small shops on Bleecker, Hudson and Greenwich. Hudson River Park runs the length of the western edge with piers, lawns and a bike path.',
    highlights: [
      'Irregular street grid predating the 1811 Commissioners\' Plan',
      'Low-rise Federal and Greek Revival row houses',
      'Hudson River Park piers along the western edge',
      'Bleecker, Hudson and Greenwich carry the retail',
      'Greenwich Village Historic District covers most blocks',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'lower-east-side',
    name: 'Lower East Side',
    borough: 'Manhattan',
    scores: { pace: 5, nightlife: 5, dining: 5, green_space: 2, walkability: 5, transit_access: 4 },
    car_friendly: 1,
    housing_stock: ['walkup', 'prewar', 'coop', 'condo', 'new_construction'],
    rent_ranges: {
      studio: { min: 2500, max: 3300 },
      one_bed: { min: 3100, max: 4300 },
      two_bed: { min: 4200, max: 6200 },
    },
    sale_ranges: {
      condo: { min: 900000, max: 2000000 },
      coop: { min: 450000, max: 1000000 },
      townhouse_multifamily: { min: 2500000, max: 6000000 },
    },
    subway_lines: ['F', 'J', 'M', 'Z', 'B', 'D'],
    commute_minutes: { midtown: 25, downtown_fidi: 15 },
    description:
      'Six-story tenement walk-ups built in the 1880s and 1890s fill the blocks between Houston and Delancey, most with fire escapes above storefronts. Orchard, Ludlow and Rivington Streets carry bars, restaurants and galleries, and Essex Market holds food vendors in a hall rebuilt in 2019. Seward Park and East River Park provide the open space, and Delancey Street feeds the Williamsburg Bridge.',
    highlights: [
      'Dense tenement walk-up stock from the 1880s and 1890s',
      'Essex Market and the Essex Crossing complex',
      'Bar and restaurant density on Orchard and Ludlow Streets',
      'East River Park and the waterfront esplanade',
      'F, J, M and Z trains at Delancey–Essex',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'upper-west-side',
    name: 'Upper West Side',
    borough: 'Manhattan',
    scores: { pace: 3, nightlife: 3, dining: 4, green_space: 5, walkability: 5, transit_access: 5 },
    car_friendly: 2,
    housing_stock: ['prewar', 'coop', 'condo', 'elevator_building', 'brownstone_rowhouse', 'postwar'],
    rent_ranges: {
      studio: { min: 2600, max: 3400 },
      one_bed: { min: 3400, max: 4800 },
      two_bed: { min: 5000, max: 8000 },
    },
    sale_ranges: {
      condo: { min: 1000000, max: 2800000 },
      coop: { min: 600000, max: 1600000 },
      townhouse_multifamily: { min: 3500000, max: 9000000 },
    },
    subway_lines: ['1', '2', '3', 'A', 'B', 'C', 'D'],
    commute_minutes: { midtown: 15, downtown_fidi: 30 },
    description:
      'Central Park runs the full eastern edge and Riverside Park the full western edge, putting most blocks within a five-minute walk of one or the other. Broadway, Amsterdam and Columbus carry the retail, with prewar limestone and brick apartment buildings on the side streets and along Central Park West. The American Museum of Natural History and Lincoln Center anchor the two ends.',
    highlights: [
      'Bounded by Central Park on one side and Riverside Park on the other',
      'Prewar limestone and brick apartment buildings throughout',
      'American Museum of Natural History and Lincoln Center',
      '1/2/3 on Broadway and A/B/C/D on Central Park West',
      'Brownstone row houses on the numbered cross streets',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'upper-east-side',
    name: 'Upper East Side',
    borough: 'Manhattan',
    scores: { pace: 3, nightlife: 3, dining: 4, green_space: 4, walkability: 5, transit_access: 4 },
    car_friendly: 2,
    housing_stock: ['prewar', 'coop', 'condo', 'elevator_building', 'townhouse', 'postwar'],
    rent_ranges: {
      studio: { min: 2400, max: 3200 },
      one_bed: { min: 3100, max: 4400 },
      two_bed: { min: 4500, max: 7500 },
    },
    sale_ranges: {
      condo: { min: 950000, max: 2800000 },
      coop: { min: 500000, max: 1500000 },
      townhouse_multifamily: { min: 4000000, max: 12000000 },
    },
    subway_lines: ['4', '5', '6', 'Q', 'F'],
    commute_minutes: { midtown: 15, downtown_fidi: 30 },
    description:
      'Fifth and Park Avenues hold prewar cooperative buildings, many built in the 1920s and 1930s, with row houses on the numbered cross streets. Museum Mile runs along Fifth Avenue from 82nd to 105th Street, and Central Park forms the western boundary. Second and Third Avenues carry the restaurants and shops, and Q service along Second Avenue opened in 2017.',
    highlights: [
      'Museum Mile along Fifth Avenue, including the Met and the Guggenheim',
      'Prewar cooperative buildings on Fifth and Park Avenues',
      'Carl Schurz Park and the East River esplanade',
      'Q train on Second Avenue since 2017; 4/5/6 on Lexington',
      'Row houses on the numbered cross streets',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'harlem',
    name: 'Harlem',
    borough: 'Manhattan',
    scores: { pace: 3, nightlife: 3, dining: 4, green_space: 4, walkability: 4, transit_access: 5 },
    car_friendly: 3,
    housing_stock: ['brownstone_rowhouse', 'prewar', 'walkup', 'coop', 'condo', 'new_construction'],
    rent_ranges: {
      studio: { min: 1900, max: 2500 },
      one_bed: { min: 2400, max: 3300 },
      two_bed: { min: 3000, max: 4500 },
    },
    sale_ranges: {
      condo: { min: 600000, max: 1300000 },
      coop: { min: 350000, max: 800000 },
      townhouse_multifamily: { min: 1500000, max: 3500000 }, // REVIEW — spread is wide across sub-areas
    },
    subway_lines: ['2', '3', 'A', 'B', 'C', 'D', '4', '5', '6', '1'],
    commute_minutes: { midtown: 25, downtown_fidi: 40 },
    description:
      'Brownstone and limestone row houses fill blocks such as West 138th and 139th Streets in the St. Nicholas Historic District, built in the 1890s to designs by Stanford White and others. 125th Street is the main commercial corridor, with the Apollo Theater and the Studio Museum along it. Marcus Garvey Park, St. Nicholas Park and the northern end of Central Park provide the open space.',
    highlights: [
      'St. Nicholas Historic District row houses from the 1890s',
      '125th Street commercial corridor',
      'Apollo Theater and the Studio Museum in Harlem',
      'Marcus Garvey Park, St. Nicholas Park, northern Central Park',
      'Express service on the 2/3 and A/D lines',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'chelsea',
    name: 'Chelsea',
    borough: 'Manhattan',
    scores: { pace: 4, nightlife: 4, dining: 5, green_space: 4, walkability: 5, transit_access: 5 },
    car_friendly: 1,
    housing_stock: ['prewar', 'postwar', 'condo', 'coop', 'elevator_building', 'brownstone_rowhouse'],
    rent_ranges: {
      studio: { min: 3000, max: 3900 },
      one_bed: { min: 3800, max: 5200 },
      two_bed: { min: 5500, max: 8500 },
    },
    sale_ranges: {
      condo: { min: 1200000, max: 3200000 },
      coop: { min: 650000, max: 1500000 },
      townhouse_multifamily: { min: 4000000, max: 10000000 },
    },
    subway_lines: ['A', 'C', 'E', '1', '2', '3', 'F', 'M', 'L'],
    commute_minutes: { midtown: 12, downtown_fidi: 20 },
    description:
      'The High Line, an elevated freight rail viaduct converted to a 1.45-mile linear park, runs from Gansevoort Street to 34th. The blocks in the West 20s hold a concentration of ground-floor art galleries in converted garages and warehouses. Side streets have brick row houses, Eighth and Ninth Avenues carry the restaurants, and large postwar complexes sit along the eastern and southern edges.',
    highlights: [
      'High Line elevated park running the length of the neighborhood',
      'Gallery district concentrated in the West 20s',
      'Chelsea Market in the former Nabisco factory complex',
      'Hudson River Park and Chelsea Piers on the waterfront',
      'Nine subway lines across Eighth Avenue and Seventh Avenue',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'murray-hill',
    name: 'Murray Hill',
    borough: 'Manhattan',
    scores: { pace: 4, nightlife: 4, dining: 4, green_space: 2, walkability: 5, transit_access: 5 },
    car_friendly: 2,
    housing_stock: ['postwar', 'prewar', 'walkup', 'elevator_building', 'coop', 'condo', 'brownstone_rowhouse'],
    rent_ranges: {
      studio: { min: 2600, max: 3400 },
      one_bed: { min: 3300, max: 4500 },
      two_bed: { min: 4500, max: 6800 },
    },
    sale_ranges: {
      condo: { min: 900000, max: 2200000 },
      coop: { min: 450000, max: 1100000 },
      townhouse_multifamily: { min: 3000000, max: 7000000 },
    },
    subway_lines: ['4', '5', '6', '7', 'S'],
    commute_minutes: { midtown: 10, downtown_fidi: 20 },
    description:
      'Prewar walk-ups and postwar white-brick elevator buildings make up most of the housing, with a small historic district of 1850s brownstones around 36th Street and Park Avenue. Third and Second Avenues carry a dense run of bars and restaurants. Grand Central Terminal sits at the northern edge, putting four subway lines, Metro-North and the LIRR within walking distance.',
    highlights: [
      'Grand Central Terminal at the northern edge',
      'Metro-North and LIRR access without a transfer',
      'Postwar white-brick elevator buildings dominate the stock',
      'Bar and restaurant density on Third and Second Avenues',
      'Murray Hill Historic District brownstones near Park Avenue',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'financial-district',
    name: 'Financial District',
    borough: 'Manhattan',
    scores: { pace: 3, nightlife: 3, dining: 4, green_space: 3, walkability: 5, transit_access: 5 },
    car_friendly: 2,
    housing_stock: ['new_construction', 'condo', 'elevator_building', 'prewar', 'coop'],
    rent_ranges: {
      studio: { min: 2800, max: 3600 },
      one_bed: { min: 3400, max: 4800 },
      two_bed: { min: 4800, max: 7500 },
    },
    sale_ranges: {
      condo: { min: 800000, max: 2000000 },
      coop: { min: 450000, max: 1000000 },
      townhouse_multifamily: null, // REVIEW — effectively no row house stock
    },
    subway_lines: ['1', '2', '3', '4', '5', 'A', 'C', 'E', 'J', 'Z', 'R', 'W'],
    commute_minutes: { midtown: 20, downtown_fidi: 5 },
    description:
      'The street grid predates the 1811 Commissioners\' Plan, so Stone, Pearl and Beaver Streets bend and narrow between tall buildings. Much of the housing is converted office towers from the 1920s and 1930s alongside newer high-rises. Battery Park, the South Street Seaport and the waterfront Esplanade wrap the southern tip, and the Fulton Center and Oculus connect a dozen subway lines underground.',
    highlights: [
      'Twelve subway lines plus PATH at Fulton Center and the Oculus',
      'Converted 1920s and 1930s office towers',
      'Battery Park and the waterfront Esplanade at the southern tip',
      'South Street Seaport and the cobbled Stone Street corridor',
      'Staten Island Ferry terminal at Whitehall',
    ],
    data_note: DATA_NOTE,
  },

  // ------------------------------------------------------------------ Queens
  {
    id: 'astoria',
    name: 'Astoria',
    borough: 'Queens',
    scores: { pace: 3, nightlife: 4, dining: 5, green_space: 4, walkability: 4, transit_access: 4 },
    car_friendly: 4,
    housing_stock: ['two_three_family', 'walkup', 'prewar', 'postwar', 'coop', 'condo', 'elevator_building'],
    rent_ranges: {
      studio: { min: 1900, max: 2500 },
      one_bed: { min: 2300, max: 3200 },
      two_bed: { min: 2900, max: 4000 },
    },
    sale_ranges: {
      condo: { min: 500000, max: 1000000 },
      coop: { min: 300000, max: 650000 },
      townhouse_multifamily: { min: 900000, max: 1800000 },
    },
    subway_lines: ['N', 'W', 'M', 'R', 'F'],
    commute_minutes: { midtown: 25, downtown_fidi: 40 },
    description:
      'Two- and three-family houses on tree-lined streets make up most of the housing, with prewar and postwar elevator buildings along 31st Street and Astoria Boulevard. Steinway Street, 30th Avenue, Broadway and Ditmars Boulevard each carry their own run of restaurants and storefronts. Astoria Park has a 1936 WPA pool, a running track and a waterfront lawn beneath the Hell Gate Bridge.',
    highlights: [
      'Astoria Park with the 1936 WPA pool and waterfront track',
      'Four separate retail corridors, each with its own character of shops',
      'Mostly two- and three-family houses on tree-lined streets',
      'N and W on 31st Street; M and R on Broadway and Steinway',
      'Museum of the Moving Image and Kaufman Astoria Studios',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'long-island-city',
    name: 'Long Island City',
    borough: 'Queens',
    scores: { pace: 4, nightlife: 3, dining: 4, green_space: 4, walkability: 4, transit_access: 5 },
    car_friendly: 3,
    housing_stock: ['new_construction', 'condo', 'elevator_building', 'coop', 'two_three_family'],
    rent_ranges: {
      studio: { min: 2600, max: 3400 },
      one_bed: { min: 3200, max: 4300 },
      two_bed: { min: 4200, max: 6000 },
    },
    sale_ranges: {
      condo: { min: 700000, max: 1600000 },
      coop: { min: 400000, max: 800000 },
      townhouse_multifamily: { min: 1200000, max: 2200000 }, // REVIEW — small row house pocket in Hunters Point only
    },
    subway_lines: ['7', 'E', 'M', 'G', 'N', 'W', 'F'],
    commute_minutes: { midtown: 15, downtown_fidi: 30 },
    description:
      'Glass residential towers line the East River waterfront at Hunters Point, with Gantry Plaza State Park and Hunter\'s Point South Park beneath them facing Midtown across the water. Court Square and Jackson Avenue hold a second cluster of towers along with MoMA PS1 in a converted public school building. Blocks further inland still hold working warehouses and light industry.',
    highlights: [
      'Gantry Plaza State Park with the restored Pepsi-Cola sign and gantries',
      'One stop to Grand Central on the 7 train',
      'MoMA PS1 in a converted school building',
      'NYC Ferry at Hunters Point South',
      'Mostly new high-rise towers; a small row house pocket in Hunters Point',
    ],
    data_note: DATA_NOTE,
  },
  {
    id: 'forest-hills',
    name: 'Forest Hills',
    borough: 'Queens',
    scores: { pace: 2, nightlife: 2, dining: 3, green_space: 4, walkability: 4, transit_access: 4 },
    car_friendly: 4,
    housing_stock: ['coop', 'prewar', 'postwar', 'elevator_building', 'townhouse', 'two_three_family'],
    rent_ranges: {
      studio: { min: 1700, max: 2200 },
      one_bed: { min: 2100, max: 2800 },
      two_bed: { min: 2700, max: 3700 },
    },
    sale_ranges: {
      condo: { min: 400000, max: 800000 },
      coop: { min: 250000, max: 550000 },
      townhouse_multifamily: { min: 900000, max: 2000000 },
    },
    subway_lines: ['E', 'F', 'M', 'R'],
    commute_minutes: { midtown: 35, downtown_fidi: 50 }, // REVIEW — LIRR cuts the Midtown figure to about 20
    description:
      'Forest Hills Gardens, laid out in 1909, has Tudor-style houses along private curving streets around Station Square. Austin Street is the main retail corridor, and large prewar and postwar cooperative buildings line Queens Boulevard and the streets near the subway. Forest Park, 538 acres with a golf course and bridle paths, runs along the southern edge.',
    highlights: [
      'Forest Hills Gardens: Tudor houses on private curving streets',
      'Austin Street retail corridor',
      'LIRR at Forest Hills, roughly twenty minutes to Penn Station',
      'Forest Park, 538 acres, along the southern edge',
      'Large prewar and postwar co-op buildings near Queens Boulevard',
    ],
    data_note: DATA_NOTE,
  },
]
