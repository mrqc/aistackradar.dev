const width = 800;
const height = 800;
const radius = Math.min(width, height) / 2 - 40;

const svg = d3.select("#radar")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

const rings = [
    { name: "Core", radius: radius * 0.35, color: "var(--core-color)" },
    { name: "Rising", radius: radius * 0.7, color: "var(--rising-color)" },
    { name: "Experimental", radius: radius, color: "var(--experimental-color)" }
];

const quadrants = [
    { name: "Orchestration", startAngle: 0, endAngle: 90 },
    { name: "Agentic", startAngle: 90, endAngle: 180 },
    { name: "Observability", startAngle: 180, endAngle: 270 },
    { name: "Data/Vector", startAngle: 270, endAngle: 360 }
];

// Draw rings
svg.selectAll(".ring")
    .data(rings)
    .enter()
    .append("circle")
    .attr("class", "ring")
    .attr("r", d => d.radius);

// Draw axes
svg.selectAll(".axis")
    .data(quadrants)
    .enter()
    .append("line")
    .attr("class", "axis")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", d => radius * Math.cos((d.startAngle * Math.PI) / 180))
    .attr("y2", d => radius * Math.sin((d.startAngle * Math.PI) / 180));

// Draw quadrant labels
svg.selectAll(".quadrant-label")
    .data(quadrants)
    .enter()
    .append("text")
    .attr("class", "quadrant-label")
    .attr("x", d => {
        const angle = (d.startAngle + d.endAngle) / 2;
        return (radius + 25) * Math.cos((angle * Math.PI) / 180);
    })
    .attr("y", d => {
        const angle = (d.startAngle + d.endAngle) / 2;
        return (radius + 25) * Math.sin((angle * Math.PI) / 180);
    })
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(d => d.name);

// Load data
d3.csv("radar-data.csv").then(data => {
    let allData = data;
    
    const nodes = data.map(d => {
        const quad = quadrants.find(q => q.name === d.Layer) || quadrants[1]; // Default to Agentic
        const ring = rings.find(r => r.name === d["Radar Status"]) || rings[2]; // Default to Experimental
        
        // Random position within the ring and quadrant
        const ringIndex = rings.indexOf(ring);
        const innerRadius = ringIndex === 0 ? 20 : rings[ringIndex - 1].radius + 20;
        const outerRadius = ring.radius - 20;
        
        const r = innerRadius + Math.random() * (outerRadius - innerRadius);
        const angle = (quad.startAngle + 10 + Math.random() * (quad.endAngle - quad.startAngle - 20)) * (Math.PI / 180);
        
        return {
            ...d,
            x: r * Math.cos(angle),
            y: r * Math.sin(angle),
            color: ring.color
        };
    });

    renderRadar(nodes);
    renderList(allData);

    // Search and Filter Listeners
    d3.select("#tool-search").on("input", function() {
        filterAndRender();
    });

    d3.select("#layer-filter").on("change", function() {
        filterAndRender();
    });

    d3.select("#status-filter").on("change", function() {
        filterAndRender();
    });

    function filterAndRender() {
        const searchTerm = d3.select("#tool-search").property("value").toLowerCase();
        const layerFilter = d3.select("#layer-filter").property("value");
        const statusFilter = d3.select("#status-filter").property("value");

        const filtered = allData.filter(d => {
            const matchesSearch = d["Tool Name"].toLowerCase().includes(searchTerm) || 
                                d["One-Line Pitch"].toLowerCase().includes(searchTerm);
            const matchesLayer = layerFilter === "all" || d.Layer === layerFilter;
            const matchesStatus = statusFilter === "all" || d["Radar Status"] === statusFilter;
            return matchesSearch && matchesLayer && matchesStatus;
        });

        renderList(filtered);
    }
});

function renderRadar(nodes) {
    const nodeGroups = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
        .on("click", (event, d) => showDetails(d));

    nodeGroups.append("circle")
        .attr("r", 6)
        .attr("fill", d => d.color)
        .attr("stroke", "rgba(255,255,255,0.2)")
        .attr("stroke-width", 1);

    nodeGroups.append("text")
        .attr("dx", 10)
        .attr("dy", 4)
        .text(d => d["Tool Name"]);
}

function renderList(data) {
    const listContainer = d3.select("#tool-list");
    listContainer.html(""); // Clear existing

    const cards = listContainer.selectAll(".tool-card")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "tool-card")
        .on("click", (event, d) => {
            showDetails(d);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

    cards.append("h3").text(d => d["Tool Name"]);
    cards.append("p").attr("class", "card-pitch").text(d => d["One-Line Pitch"]);
    
    const meta = cards.append("div").attr("class", "card-meta");
    meta.append("span").attr("class", "card-layer").text(d => d.Layer);
    meta.append("span")
        .attr("class", d => `card-status ${d["Radar Status"].toLowerCase()}`)
        .text(d => d["Radar Status"]);
}

function showDetails(d) {
    const panel = d3.select("#details-panel");
    panel.classed("hidden", false);
    
    d3.select("#tool-name").text(d["Tool Name"]);
    d3.select("#tool-pitch").text(d["One-Line Pitch"]);
    d3.select("#tool-layer").text(d.Layer);
    d3.select("#tool-status").text(d["Radar Status"]);
    d3.select("#tool-pricing").text(d["Pricing Model"]);
    d3.select("#tool-features").text(d["Key Features"]);
    d3.select("#tool-summary").text(d["AI Summary"]);
    d3.select("#tool-url")
        .attr("href", d["Website URL"])
        .text(`Visit ${d["Tool Name"]} Website`);
}

d3.select("#close-details").on("click", () => {
    d3.select("#details-panel").classed("hidden", true);
});

// Close panel when clicking outside the radar nodes (optional but good)
d3.select("body").on("click", (event) => {
    if (!event.target.closest(".node") && !event.target.closest("#details-panel")) {
        d3.select("#details-panel").classed("hidden", true);
    }
});
