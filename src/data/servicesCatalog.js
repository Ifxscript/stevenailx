export const nailServices = {
  "title": "Nail Studio Menu",
  "services": [
    {
      "category": "Manicure",
      "sections": [{
        "items": [
          { "id": "n_m1", "name": "Classic Manicure", "price": 10000 },
          { "id": "n_m2", "name": "Jelly Manicure", "price": 12000 }
        ]
      }]
    },
    {
      "category": "Pedicure",
      "sections": [{
        "items": [
          { "id": "n_p1", "name": "Regular Classic Pedicure", "price": 12000 },
          { "id": "n_p2", "name": "Jelly Pedicure", "price": 20000 },
          { "id": "n_p3", "name": "Luxury Pedicure", "price": 30000 }
        ]
      }]
    },
    {
      "category": "Acrylic",
      "sections": [{
        "items": [
          { "id": "n_a1", "name": "Full Set Short/Plain", "price": 20000 },
          { "id": "n_a2", "name": "Full Set Medium/Plain", "price": 25000 },
          { "id": "n_a3", "name": "Full Set French Tips", "price": 25000 },
          { "id": "n_a4", "name": "Full Set Long", "price_from": 30000, "price_to": 35000 },
          { "id": "n_a5", "name": "Acrylic Refill", "price_from": 15000, "price_to": 20000 }
        ]
      }]
    },
    {
      "category": "Poly Gel",
      "sections": [{
        "items": [
          { "id": "n_pg1", "name": "Plain on Natural Nails", "price": 15000 },
          { "id": "n_pg2", "name": "With Extension", "price": 20000 },
          { "id": "n_pg3", "name": "French Tips", "price": 25000 }
        ]
      }]
    },
    {
      "category": "BIAB",
      "sections": [{
        "items": [
          { "id": "n_b1", "name": "Plain on Natural Nails", "price": 15000 },
          { "id": "n_b2", "name": "With Extension Plain", "price": 20000 },
          { "id": "n_b3", "name": "French Tips", "price": 25000 }
        ]
      }]
    },
    {
      "category": "Gel Services",
      "sections": [{
        "items": [
          { "id": "n_g1", "name": "Stick On Gel Nails Plain", "price": 20000 },
          { "id": "n_g2", "name": "Gel Polish (Hands)", "price": 5000 },
          { "id": "n_g3", "name": "Toe Gel Nails", "price": 5000 },
          { "id": "n_g4", "name": "Builder Gel (BIAB)", "price": 20000 },
          { "id": "n_g5", "name": "Hard Gel Extension", "price": 30000 }
        ]
      }]
    },
    {
      "category": "Designs",
      "sections": [{
        "items": [
          { "id": "n_d1", "name": "Gel Polish Design", "price_from": 6000, "price_to": 10000 },
          { "id": "n_d2", "name": "Simple Nail Art", "price": 5000 },
          { "id": "n_d3", "name": "Advanced Nail Art", "price": 10000 },
          { "id": "n_d4", "name": "Luxury Nail Art", "price_from": 15000 }
        ]
      }]
    },
    {
      "category": "Add-Ons",
      "sections": [{
        "items": [
          { "id": "n_ao1", "name": "French Tips", "price_from": 3000, "price_to": 5000 },
          { "id": "n_ao2", "name": "Chrome / Cat Eye", "price": 5000 },
          { "id": "n_ao3", "name": "3D Designs", "price_from": 5000 },
          { "id": "n_ao4", "name": "Nail Repair", "price": 2000, "unit": "per nail" },
          { "id": "n_ao5", "name": "Soak Off", "price": 5000 },
          { "id": "n_ao6", "name": "Dissolving", "price": 3000 }
        ]
      }]
    },
    {
      "category": "Extras",
      "sections": [{
        "items": [
          { "id": "n_e1", "name": "Hand Spa Treatment", "price_from": 7000, "price_to": 10000 },
          { "id": "n_e2", "name": "Foot Spa Treatment", "price": 10000 },
          { "id": "n_e3", "name": "Paraffin Treatment", "price": 8000 }
        ]
      }]
    }
  ]
};

export const salonServices = {
  "title": "Beauty & Salon Menu",
  "services": [
    {
      "category": "Hair Services",
      "sections": [
        {
          "title": "Installation",
          "items": [
            { "id": "s_hi1", "name": "Frontal Install", "price": 28000 },
            { "id": "s_hi2", "name": "Closure Install", "price": 20000 },
            { "id": "s_hi3", "name": "Frontal Ponytail", "price": 35000 },
            { "id": "s_hi4", "name": "Double Frontal / 360", "price": 70000 },
            { "id": "s_hi5", "name": "Hairline Ponytail", "price": 15000 }
          ]
        },
        {
          "title": "Styling",
          "items": [
            { "id": "s_hs1", "name": "Curling", "price": 10000 },
            { "id": "s_hs2", "name": "Straightening", "price": 6000 },
            { "id": "s_hs3", "name": "Custom Styling", "price": 15000 }
          ]
        },
        {
          "title": "Revamp",
          "items": [
            { "id": "s_hr1", "name": "Hair Revamp", "price": 10000 }
          ]
        },
        {
          "title": "Customization",
          "items": [
            { "id": "s_hc1", "name": "Tinting Knots", "price": 5000 },
            { "id": "s_hc2", "name": "Plucking & Customization", "price": 10000 }
          ]
        }
      ]
    },
    {
      "category": "Braiding Services",
      "sections": [
        {
          "description": "(Extensions Included)",
          "items": [
            { "id": "s_b1", "name": "Stitch Braids (Alicia Keys)", "price": 50000 },
            { "id": "s_b2", "name": "Weaving & Washing", "price": 15000 },
            { "id": "s_b3", "name": "Small Knotless Braids", "price": 85000 },
            { "id": "s_b4", "name": "Medium Knotless Braids", "price": 75000 },
            { "id": "s_b5", "name": "Jumbo Knotless Braids", "price": 60000 },
            { "id": "s_b6", "name": "Boho Braids (Small)", "price": 95000 },
            { "id": "s_b7", "name": "Boho Braids (Medium)", "price": 80000 },
            { "id": "s_b8", "name": "French Curls (Small)", "price": 95000 },
            { "id": "s_b9", "name": "French Curls (Short)", "price": 80000 },
            { "id": "s_b10", "name": "French Curls Boho (Long)", "price": 95000 },
            { "id": "s_b11", "name": "French Curls Boho (Short)", "price": 80000 }
          ]
        }
      ]
    },
    {
      "category": "Lash Services",
      "sections": [
        {
          "title": "Classic Lash",
          "items": [
            { "id": "s_lc1", "name": "Classic Set", "price": 18000 },
            { "id": "s_lc2", "name": "Classic Cat Eye", "price": 20000 },
            { "id": "s_lc3", "name": "Flirty Set", "price": 27000 },
            { "id": "s_lc4", "name": "Wispy Eye", "price": 30000 },
            { "id": "s_lc5", "name": "Wispy Cat Eye", "price": 35000 }
          ]
        },
        {
          "title": "Volume Lash",
          "items": [
            { "id": "s_lv1", "name": "Volume Set", "price": 25000 },
            { "id": "s_lv2", "name": "Volume Cat Eye", "price": 28000 },
            { "id": "s_lv3", "name": "Mega Volume", "price": 30000 },
            { "id": "s_lv4", "name": "Russian Mega Volume", "price": 30000 },
            { "id": "s_lb1", "name": "Bottom Lash Set", "price": 8000 }
          ]
        },
        {
          "title": "Hybrid Lash",
          "items": [
            { "id": "s_lh1", "name": "Hybrid Set", "price": 23000 },
            { "id": "s_lh2", "name": "Hybrid Cat Set", "price": 25000 },
            { "id": "s_lh3", "name": "Lash Removal", "price": 5000 },
            { "id": "s_lh4", "name": "Lash Refill", "price_note": "50% of original price" }
          ]
        }
      ]
    }
  ]
};

export const servicesCatalog = {
  nails: nailServices,
  salon: salonServices
};
