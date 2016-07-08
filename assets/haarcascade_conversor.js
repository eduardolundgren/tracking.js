(function(){
	'use strictc';

	/**
	* Convert json to be used by tracking.js
	* @param {Object} json as file opencv_haarcascade_eye.js
	* @returns {Array}
	*/
	var conversor = function(json){
		if(!json['@type_id']  || json['@type_id'] != 'opencv-haar-classifier'){
			return "this format is not valid!";
		}
		var res = [];

		// Getting size
		var parts = json.size.split(' ');
		res.push(parseInt(parts[0]));
		res.push(parseInt(parts[1]));

		var stages = json.stages;

		for(var i in stages){
			// stage threshold
			res.push(parseFloat(stages[i].stage_threshold));
			// tree length
			res.push(stages[i].trees.length)

			// trees
			for(var j in stages[i].trees){
				var rects = stages[i].trees[j][0].feature.rects;
				// getting tilted
				res.push(parseInt(stages[i].trees[j][0].feature.tilted));
				// getting rects count
				res.push(rects.length);
				for(var r in rects){
					// removing dot in rects
					rects[r] = rects[r].replace('.','');
					parts = rects[r].split(' ');
					for(var p in parts){
						// getting rect itens
						res.push(parseInt(parts[p]))
					}
				}
				res.push(parseFloat(stages[i].trees[j][0].threshold))
				res.push(parseFloat(stages[i].trees[j][0].left_val))
				res.push(parseFloat(stages[i].trees[j][0].right_val))
			}

		}
		return res;
	}

	// Exports to Node.js or Create reference in browser
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = conversor;
		}
		exports.conversor = conversor;
	} else {
		window.conversor = conversor;
	}
}());