/**************************************************
Gestion du temps v1.00
Copyright 2011 Maximilien KNOPP and Jean-Loup CASTAIGNE
Contact: maximilien[at]maxk.fr

This file is part of Gestion du temps.

    Foobar is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Foobar is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Gestion du temps.  If not, see <http://www.gnu.org/licenses/>.
***************************************************/

/*
 Création d'une variable globale pour l'échange des stats entre les fonctions
 Cette variable est un tableau associatif bidimentionnel définit comme suit:
 Resultat[Nom du bouton][index]

 avec
 Nom du bouton: C'est le nom du bouton affiché sur l'interface
 index: un nombre entier, l'index corespondra à une donnée:
		0 : le nombre total de fois que le bouton est resté appuyé
		1 : la durée total durant laquelle le bouton est resté appuyé
		2 : le timecode au moment duquel le bouton est passé dans l'état "appuyé"
		3 : la durée minimale durant laquelle le bouton est resté dans l'état appuyé
		4 : la durée maximale durant laquelle le bouton est resté dans l'état appuyé
*/
var Resultats = new Array();

// Variables globale d'indexage des cadres et des boutons lors de leur création
// Elles permettent de connaître le nombre de cadre ou de bouton créés ou déjà présents
// lors de la configuration
var numcadre = 1;
var numbouton = 1;

// Fonction principal gérant le comportement des boutons
function timetracking()
{
	// Chaque fois qu'un boutton est cliqué on ajoute ou on retire
	// la classe "pressed" du bouton. Cette classe sert à la mise en forme
	// ainsi qu'a savoir si le boutton est appuyé ou non.

	$('.bouton').click(function () {
		// ajoute ou suprime la classe "pressed" à chaque click en fonction de
		// son état initial (pressed ou non).
		// La fonction "storedata" s'occupe en fonction de son état initial
		// soit de marquer le timecode au moment ou il a été appuyé, soit
		// de calculer le temps durant lequel il est resté appuyé.
		storedata($(this));
		$(this).toggleClass("pressed");

		// détecte le groupe auquel le bouton cliqué appartient
		var groupe = $(this).attr('class');
		groupe = groupe.substr(11,2);

		// retire la classe "pressed" de tous les bouton n'appartenant pas
		// au groupe du bouton cliqué
		$(".pressed").not("."+groupe).each(function () {
			storedata($(this));
			$(this).removeClass('pressed');
		});

		// détecte le sous-groupe auquel le bouton cliqué appartient
		var sousgroupe = $(this).attr('class');
		sousgroupe = sousgroupe.substr(14,1);

		// retire la classe "pressed" de tous les bouton n'appartenant pas
		// au sous-groupe du bouton cliqué
		// le sous-groupe par défaut est le sous-groupe "a". les boutons
		// appartenant à ce sous-groupe par défaut ne sont pas concerné

		if ( $(this).hasClass("pressed") && $(this).hasClass("a") == false )
		{
			$(".pressed").not("."+sousgroupe).not(".a").each(function () {
				storedata($(this));
				$(this).removeClass('pressed');
			});
		}

		// Affichage/Mise à jour du rapport à chaque clique
		displayreport();
	});

}

// Fonction permettant de génerer le time code ou de calculer la durée d'appuie
// lors d'un changement d'état d'un bouton
function storedata(bouton)
{
	// définition d'une expression régulière afin de déterminé si le bouton était appuyé ou non
	var pressed = new RegExp("pressed","gi");

	// récupération des groupe et de l'etat du bouton
	var listeclasses = bouton.attr('class');
	var nombouton = bouton.text();

	// définition de la variable pour la gestion du timecode
	var timecode = new Date();

	// Si le bouton était initalement à l'état appuyé, on calcul la durée d'appuie
	if (listeclasses.match(pressed))
	{
		var timecode = new Date();
		Resultats[nombouton][1] = Resultats[nombouton][1] + ( timecode.getTime() - Resultats[nombouton][2] );
		// ajout de la durée minimale d'appuie
		if ( Resultats[nombouton][3] == 0 )
		{
			Resultats[nombouton][3] = timecode.getTime() - Resultats[nombouton][2];
		}
		else if ( ( timecode.getTime() - Resultats[nombouton][2] ) < Resultats[nombouton][3] )
		{
			Resultats[nombouton][3] = timecode.getTime() - Resultats[nombouton][2];
		}
		// ajout de la durée maximale d'appuie
		if ( ( timecode.getTime() - Resultats[nombouton][2] ) > Resultats[nombouton][4] )
		{
			Resultats[nombouton][4] = timecode.getTime() - Resultats[nombouton][2];
		}
	}
	// Sinon, on génère un timecode et on incrémente le compteur de clique
	else
	{
		// Ajout du timecode
		
		// Si le bouton n'a jamais été appuyé, on initialises les données associées à ce bouton
		if(typeof(Resultats[nombouton])=='undefined')
		{
			Resultats[nombouton] = new Array(0, 0, 0, 0, 0);
		}
		// On ajoute simplement le time code et on incrémente le compteur de clique
		Resultats[nombouton][0] = Resultats[nombouton][0] + 1;
		Resultats[nombouton][2] = timecode.getTime();
	}
}

// Fonction d'affichage du rapport
function displayreport() 
{
	// Initialisation des variables
	// Initialisation de la première ligne du rapport (entêtes des colonnes)
	var rapport = "<table class='rapport_table'><thead><tr class='ligne titre'><th class='name'>Nom du bouton</th><th class='freq'>Compteur</th><th class='total'>Durée totale</th><th class='mini'>Durée minimale</th><th class='maxi'>Durée maximale</th><th class='moy'>Durée moyenne</th></tr></thead>\n";
	var totale = "";
	var mini = "";
	var maxi = "";
	var moyenne = "";

	for (var cle in Resultats)
	{
		// Calcul des stats (résultats des durées en secondes)
		totale = Math.round(Resultats[cle][1] / 1000);
		mini = Math.round(Resultats[cle][3] / 1000);
		maxi = Math.round(Resultats[cle][4] / 1000);
		moyenne = Math.round( (Resultats[cle][1] / 1000) / Resultats[cle][0] );
		totale = secondsToTime(totale);
		mini = secondsToTime(mini);
		maxi = secondsToTime(maxi);
		moyenne = secondsToTime(moyenne);
		
		rapport = rapport + "<tr class='ligne'><td class='name'>" + cle + "</td><td class='freq'>" + Resultats[cle][0] + "</td><td class='total'>" + totale + "</td><td class='mini'>" + mini + "</td><td class='maxi'>" + maxi + "</td><td class='moy'>" + moyenne + "</td></tr>\n";
	}

	rapport = rapport + "</table>\n";
	// Affichage du rapport: On affiche la div puis on y insert le contenu
	$("#rapport").show();
	document.getElementById("result").innerHTML='';
	document.getElementById("result").innerHTML=rapport;

}

// Fonction de convertion d'un temps en secondes en heure/minutes/secondes
function secondsToTime(secs)
{
	var hours = Math.floor(secs / (60 * 60));
	var divisor_for_minutes = secs % (60 * 60);
	var minutes = Math.floor(divisor_for_minutes / 60);
	var divisor_for_seconds = divisor_for_minutes % 60;
	var seconds = Math.ceil(divisor_for_seconds);
	var result = "";

	if ( hours != 0 )
	{
		if ( minutes < 10 )
		{
			if ( seconds < 10 ) { result = hours + " h 0" + minutes + " min 0" + seconds + " s"; }
			else { result = hours + " h 0" + minutes + " min " + seconds + " s"; }
		}
		else
		{
			if ( seconds < 10 ) { result = hours + " h " + minutes + " min 0" + seconds + " s"; }
			else { result = hours + " h " + minutes + " min " + seconds + " s"; }
		}
	}
	else
	{
		if ( minutes != 0)
		{
			if ( seconds < 10 ) { result = minutes + " min 0" + seconds + " s"; }
			else { result = minutes + " min " + seconds + " s"; }
		}
		else { result = seconds + " s"; }
	}

	return result;
}

// Fonction utilisé dans l'interface de configuration pour l'ajout d'un cadre
function ajoutecadre()
{
	// Incrémentation de la variable globale listant le nombre de cadre
	numcadre += 1;

	// Création d'un élément du formulaire pour créer un cadre
	var addform = document.createElement("div");
	var idvalue = document.createAttribute("id");
	idvalue.nodeValue = "cadre" + numcadre;
	var classvalue = document.createAttribute("class");
	classvalue.nodeValue = "cadreelt";
	addform.setAttributeNode(idvalue);
	addform.setAttributeNode(classvalue);
	addform.innerHTML = "<div class='numcadre'>Cadre " + numcadre + "</div><div class='nomcadre'><label for='numcadre"+numcadre+"'>Nom du cadre : </label><input name='numcadre"+numcadre+"' id='numcadre"+numcadre+"' class='inputcadre' type='text' placeholder='Entrer le nom du cadre ici'/></div>";

	// Ajout de l'élément à la page HTML dans la div d'ID= cadreconfig
	document.getElementById("cadreconfig").appendChild(addform);
}

// Fonction utilisé dans l'interface de configuration pour la suppression du dernier cadre créé
function suppcadre()
{
	if (numcadre > 1)
	{
		var node = document.getElementById('cadreconfig');
		var lastChild = node.lastChild;
		node.removeChild(lastChild);
		numcadre -= 1;
	}
}

// Fonction utilisé lors de la configuration d'un bouton.
// Elle liste les cadres précédement créés et configure la liste déroulante de choix des cadres à affecter au bouton
function setcadrelist(obj)
{
	var idelement = obj.id;
	$('#'+idelement).find('option').remove();
	$('.inputcadre').each(function () {
		if ( $(this).val() != "" )
		{
			$('#'+idelement).append($("<option></option>").
			text($(this).val()));
		}
	});
}

// Fonction utilisé dans l'interface de configuration pour l'ajout d'un bouton
function ajoutebouton()
{
	// On incrément la varibale global listant le nombre de bouton
	numbouton += 1;

	// Création d'un élément du formulaire pour créer un bouton
	var addform = document.createElement("div");
	var idvalue = document.createAttribute("id");
	idvalue.nodeValue = "bouton" + numbouton;
	var classvalue = document.createAttribute("class");
	classvalue.nodeValue = "boutonelt";
	addform.setAttributeNode(idvalue);
	addform.setAttributeNode(classvalue);
	addform.innerHTML = "<div class='numbouton'>Bouton " + numbouton + "</div>\
													<div class='nombouton'>\
														<label for='numbouton'>Nom du bouton :</label><br />\
														<input name='numbouton' id='numbouton"+numbouton+"' class='inputbouton' type='text' placeholder='Nom du bouton'/>\
													</div>\
													<div class='groupebouton'>\
														<label for='grpbouton'>Groupe</label><br />\
														<input name='grpbouton' id='grpbouton"+numbouton+"' class='inputgrp' type='text' placeholder='Groupe'/>\
													</div>\
													<div class='groupebouton'>\
														<label for='grpbouton'>Sous-Groupe</label><br />\
														<input name='sgrpbouton' id='sgrpbouton"+numbouton+"' class='inputsgrp' type='text' placeholder='Sous-Groupe'/>\
													</div>\
													<div class='cadrebouton'>\
														<label for='cadbouton'>Cadre :</label><br />\
														<select name='cadbouton' id='cadbouton"+numbouton+"' class='inputcadb' type='text' onFocus='setcadrelist(this)';></select>\
													</div>";

	// Ajout du bouton à la page HTML dans la div d'ID= boutonconfig
	document.getElementById("boutonconfig").appendChild(addform);
}

// Fonction utilisé dans l'interface de configuration pour la suppression du dernier d'un bouton créé
function suppbouton()
{
		if (numbouton > 1)
	{
		var node = document.getElementById('boutonconfig');
		var lastChild = node.lastChild;
		node.removeChild(lastChild);
		numbouton -= 1;
	}
}

// Fonction de configuration des boutons et des cadres
// Une fois tous les champs complétés, on vérifie tous les champs, si tout est OK, on configure l'interface
// avec tous les cadres et bouton et on l'affiche.
function validate()
{
  // Test si la configuration minimum est réalisée: 1 cadre avec 1 bouton
  if (  $('#numcadre1').val() == "" ||
        $('#numbouton1').val() == "" )
  {
    displaybox('Erreur','Acune configuration valide n\'a été détectée.', 'La configuration doit comprendre au minimum un cadre et un bouton.');
    return false;
  }

	// Tableau listant les cadres créés par numéro
	var cadrearraybynum = new Array();
	// Tableau listant les cadres créés par nom
	var cadrearraybyname = new Array();
	// Tableau listant les bouton créés par numéro
	var boutonarray = new Array();
	var html = "";

	// On boucle sur tous les cadres créés (variable numcadre)
	// et on rempli les tableaux correspondants
	for (var i=1; i<numcadre + 1; i++)
	{
		cadrearraybynum[i] = new cadre($('#numcadre'+i).val());
		cadrearraybyname[$('#numcadre'+i).val()] = i;
	}

	// On boucle sur tous les bouton créés via le formulaire
	// La variable global "numbouton" donne le nombre total de bouton créés
	for (i=1; i<numbouton + 1; i++)
	{
		// Recupération des valeurs de chaque input du bouton courant
		var nombt = $('#numbouton'+i).val();		// Nom du boutn
		var numbt = i;													// Numéro du bouton ( c'est index i de la boucle )
		var grbt = $('#grpbouton'+i).val();			// Numéro du groupe
		var sgbt = $('#sgrpbouton'+i).val();		// Lettre du sous groupe
		var cadbt = $('#cadbouton'+i).val();		// Cadre auquel le bouton sera rattaché

		// Si le numéro du bouton est < 10 , on le converti en texte et on ajoute "00"
		// devant afin d'avoir "003" par exemple
		if ( numbt < 10 )
		{
			numbt = "00"+numbt;
		}
		// Si <100 on le converti en texte et on ajoute un seul "0" 
		else if ( numbt < 100 )
		{
			numbt = "0"+numbt;
		}

		// Si le champ "groupe" n'est pas un chiffre on sort
		if ( isNaN(grbt) == true)
		{
			displaybox('Erreur','Le contenu du champ "groupe" du bouton n°' + i + ' est incorrecte.', 'Ce champ doit contenir un chiffre compris entre 1 et 99.');
			return false;
		}
		// Sinon
		else
		{
			if ( grbt < 1 )
			{
				displaybox('Erreur','Le contenu du champ "groupe" du bouton n°' + i + ' est incorrecte.', 'Ce champ doit contenir un chiffre compris entre 1 et 99.');
				return false;
			}
			// Si le numéro du groupe contient moin de 2 chiffre (<10), on ajoute "0"devant
			else if ( grbt < 10 )//grbt.length < 2)
			{
				grbt = "0"+grbt;
			}
			// Si le numéro de group contient plus de 2 chiffre, c'est superieur à 99
			// => on sort
			else if ( grbt > 99)
			{
				displaybox('Erreur','Le contenu du champ "groupe" du bouton n°' + i + ' est incorrecte.', 'Ce champ doit contenir un chiffre compris entre 1 et 99.');
				return false;
			}
		}

		// Si la lettre de sous-groupe n'est pas une lettre comprise entre "a" et "z", on sort
		var checksgroup=/^[a-zA-Z]$/gi;
		if ( ! sgbt.match(checksgroup) )
		{
			displaybox('Erreur','Le contenu du champ "sous-groupe" du bouton n°' + i + ' est incorrecte.', 'Ce champ doit contenir une lettre comprise entre "a" et "z".');
			return false;
		}
		else
		{
			// au cas ou on converti la lettre en minuscule
			sgbt = sgbt.toLowerCase();
		}

		// Si le nom du cadre associé au bouton n'existe pas, on sort
		if ( typeof cadrearraybyname[cadbt] == 'undefined' )
		{
			displaybox('Erreur','Le contenu du champ "cadre" du bouton n°' + i + ' est incorrecte.', 'Ce champ ne contient pas le nom d\'un cadre existant.');
			return false;
		}

		// Création du bouton
		boutonarray[i] = new bouton(nombt,numbt,grbt,sgbt);
		// Ajout du bouton au cadre
		cadrearraybynum[cadrearraybyname[$('#cadbouton'+i).val()]].addbouton(boutonarray[i]);
	}

	// On boucle sur tous les cadres et on prépare leur affichage
	for (i=1; i<numcadre + 1; i++)
	{
		html = html + cadrearraybynum[i].affiche();
	}

	// On nettoye la page web en supprimant le contennu de la div "content"
		$("#appli").html(html);

    $("ul.tabs li a.active").removeClass("active"); //Remove any "active" class
    $(".tab_content:visible").children().fadeOut(100, function() {
      $(this).parent().hide(0, function () {
        var activeTab = $("#appli");
        $(activeTab).show(0, function () {
          $(activeTab).children().fadeIn(100);
          if ( ! $("#result").is(':empty') )
          {
            $("#rapport").children().show();
            $("#rapport").fadeIn(100); //Fade in the active ID content
          }
        });
      });
    });

	// on lance la fonction de gestion du comportement des boutons ainsi que du rapport
	timetracking();
}

// Fonction permettant de créér un objet "bouton" avec tous ses paramètres nécéssaire (nom, groupe, sousgroupe)
function bouton( nom_bouton, numero, groupe, sous_groupe) 
{
	if ( numero.length == 1 )
	{
		numero = "00" + numero;
	}
	else if ( numero.lentgh == 2 )
	{
		numero = "0" + numero;
	}
	if ( groupe.length == 1 )
	{
		groupe = "0" + groupe;
	}

	this.nom_bouton = nom_bouton;
	this.numero = numero;
	this.groupe = groupe;
	this.sous_groupe = sous_groupe;

	this.check = function () 
	{
		alert("nom du bouton : " + this.nom_bouton + "\n" +
					"numéro        : " + this.numero + "\n" +
					"groupe        : " + this.groupe + "\n" +
					"sous groupe   : " + this.sous_groupe + "\n")
	}

	this.affiche = function ()
	{
		var html = "<div class='bouton " + this.numero + " " + this.groupe + " " + this.sous_groupe + "'>" + this.nom_bouton + "</div>";
		return html;
	}

	this.change = function (nom_bouton, numero, groupe, sous_groupe)
	{
		if ( nom_bouton != "" )
		{
			this.nom_bouton = nom_bouton;
		}
		if ( numero != "" )
		{
			if ( numero.length == 1 )
			{
				numero = "00" + numero;
			}
			else if ( numero.lentgh == 2 )
			{
				numero = "0" + numero;
			}
			this.numero = numero;
		}
		if ( groupe != "" )
		{
			if ( groupe.length == 1 )
			{
				groupe = "0" + groupe;
			}
			this.groupe = groupe;
		}
		if ( sous_groupe != "" )
		{
			this.sous_groupe = sous_groupe;
		}
	}
}

// Fonction permettant de créér un objet "cadre" avec tous ses paramètres nécéssaire (nom)
function cadre(nom_cadre)
{
	this.nom_cadre = nom_cadre;
	this.listebouton = new Array();
	this.html = "";

	this.addbouton = function (bouton)
	{
		this.listebouton.push(bouton);
	}

	this.removebouton = function (bouton)
	{
		var position = this.listebouton.indexOf(bouton);
		if(position != -1) this.listebouton.splice(position, 1);
	}

	this.affiche = function ()
	{
		if ( this.listebouton.length > 0 )
		{
			this.html = "<section><div class='sectiontitle'>" + this.nom_cadre + "</div>";
			for (Val in this.listebouton)
			{
				this.html = this.html + this.listebouton[Val].affiche();
			}
			this.html = this.html + "</section>";
		}
		else
		{
			this.html = "";
		}
		return this.html;
	}
}

// Fonction de sauvegarde de la configuration des boutons et des cadres
function sauvegarde()
{
	var config = new Object();
	var listecfg = new Object();

	// configuration de base de l'objet contenant la conf
	if ( $('#savename').val() == "" )
	{
		displaybox('Erreur','Aucun nom de sauvegarde n\'a été indiqué');
		return false;
	}
	else
	{
		config["configname"] = $('#savename').val();
	}
	config["nbcadre"] = numcadre;
	config["nbbouton"] = numbouton;

	for (var i=1; i<numcadre + 1; i++)
	{
		config["cadre"+i] = $('#numcadre'+i).val();
		config[$('#numcadre'+i).val()] = i;
	}

	// On boucle sur tous les bouton créés via le formulaire
	// La variable global "numbouton" donne le nombre total de bouton créés
	for (i=1; i<numbouton + 1; i++)
	{
		// Recupération des valeurs de chaque input du bouton courant
		config["btname"+i] = $('#numbouton'+i).val();
		config["btnum"+i] = i;
		config["btgrt"+i] = $('#grpbouton'+i).val();
		config["btsgrt"+i] = $('#sgrpbouton'+i).val();
		config["btcad"+i] = $('#cadbouton'+i).val();
	}

	// On utilise ici l'API localStorage de html5
	// On a créé un objet JS contenant la conf (un simple tableau associatif)
	// On converti l'objet JS en chaine de caractère JSON pour la stocker ensuite
	// avec localStorage (cette API ne permet pas de stocker un objet)
	localStorage.setItem(config["configname"], JSON.stringify(config));

	// On créé aussi un index des sauvegardes
	if (localStorage.getItem("backuptimetracking") === null) {
  	listecfg[config["configname"]] = config["configname"];
  	localStorage.setItem("backuptimetracking", JSON.stringify(listecfg));
	}
	else
	{
		listecfg = JSON.parse(localStorage.getItem("backuptimetracking"));
		listecfg[config["configname"]] = config["configname"];
		localStorage.setItem("backuptimetracking", JSON.stringify(listecfg));
	}
	
	displaybox('Sauvegarde terminée');
}

// Fonctions de listage des sauvegardes présentes en mémoires
function getbackuplist(blockid)
{
	var listecfg = JSON.parse(localStorage.getItem("backuptimetracking"));
	if (jQuery.isEmptyObject(listecfg) == false )
	{
		$(blockid).find('option').remove();
		$(blockid).removeClass('empty');
		for (var key in listecfg)
		{
			$(blockid).append($("<option></option>").text(listecfg[key]));
		}
	}
	else
	{
		$(blockid).addClass('empty');
	}
}


function getlistbackup()
{
	var listecfg = JSON.parse(localStorage.getItem("backuptimetracking"));
	if (jQuery.isEmptyObject(listecfg) == false )
	{
		$('#backname').removeClass('empty');
		$('#backname').find('option').remove();
		for (var key in listecfg)
		{
			$('#backname').append($("<option></option>").text(listecfg[key]));
		}
	}
	else
	{
		$('#backname').addClass('empty');
	}
}

function getbackuptodelete()
{
	$('#supname').find('option').remove();
	var listecfg = JSON.parse(localStorage.getItem("backuptimetracking"));
	for (var key in listecfg)
	{
		$('#supname').append($("<option></option>").text(listecfg[key]));
	}
}

function getbackuptoexport()
{
	$('#expname').find('option').remove();
	var listecfg = JSON.parse(localStorage.getItem("backuptimetracking"));
	for (var key in listecfg)
	{
		$('#expname').append($("<option></option>").text(listecfg[key]));
	}
}

// Fonction de recharegement d'un backup
function restore()
{
	// Récupération de la conf et convertion en objet JS
	if ( $('#backname').val() == "" )
	{
		displaybox('Erreur','Aucune sauvegarde n\'a été sélectionnée.');
    return false;
	}
	var config = JSON.parse(localStorage.getItem($('#backname').val()));

	// Restoration des valeurs des variables globales de comptage des cadres et bouton
	numcadre = config["nbcadre"];
	numbouton = config["nbbouton"];

	// supression de tous les éléments d'ajout de cadre ou de bouton
	// (on nettoie l'interface pour y ajouter ensuite les éléments du backup)
	$(".cadreelt").each(function() {$(this).remove();});
	$(".boutonelt").each(function() {$(this).remove();});

	// Ajout des cadres présents dans le backup
	var listecadre = "";
	for (var i=1; i<numcadre + 1; i++)
	{
		var addform = document.createElement("div");
		var idvalue = document.createAttribute("id");
		idvalue.nodeValue = "cadre" + i;
		var classvalue = document.createAttribute("class");
		classvalue.nodeValue = "cadreelt";
		addform.setAttributeNode(idvalue);
		addform.setAttributeNode(classvalue);
		addform.innerHTML = "<div class='numcadre'>Cadre " + i + "</div><div class='nomcadre'><label for='numcadre"+i+"'>Nom du cadre : </label><input name='numcadre"+i+"' id='numcadre"+i+"' class='inputcadre' type='text' placeholder='Entrer le nom du cadre ici'/></div>";
		document.getElementById("cadreconfig").appendChild(addform);
		$('#numcadre'+i).val(config["cadre"+i]);
		listecadre = listecadre + "<option>"+config["cadre"+i]+"</option>"
	}

	// Ajout des bouton présents dans le backup
	for (var i=1; i<numbouton + 1; i++)
	{
		var addform = document.createElement("div");
		var idvalue = document.createAttribute("id");
		idvalue.nodeValue = "bouton" + i;
		var classvalue = document.createAttribute("class");
		classvalue.nodeValue = "boutonelt";
		addform.setAttributeNode(idvalue);
		addform.setAttributeNode(classvalue);
		addform.innerHTML = "<div class='numbouton'>Bouton " + i + "</div>\
													<div class='nombouton'>\
														<label for='numbouton'>Nom du bouton :</label><br />\
														<input name='numbouton' id='numbouton"+i+"' class='inputbouton' type='text' placeholder='Nom du bouton'/>\
													</div>\
													<div class='groupebouton'>\
														<label for='grpbouton'>Groupe</label><br />\
														<input name='grpbouton' id='grpbouton"+i+"' class='inputgrp' type='text' placeholder='Groupe'/>\
													</div>\
													<div class='groupebouton'>\
														<label for='grpbouton'>Sous-Groupe</label><br />\
														<input name='sgrpbouton' id='sgrpbouton"+i+"' class='inputsgrp' type='text' placeholder='Sous-Groupe'/>\
													</div>\
													<div class='cadrebouton'>\
														<label for='cadbouton'>Cadre :</label><br />\
														<select name='cadbouton' id='cadbouton"+i+"' class='inputcadb' type='text' onFocus='setcadrelist(this)';></select>\
													</div>";
		document.getElementById("boutonconfig").appendChild(addform);
		$('#numbouton'+i).val(config["btname"+i]);
		$('#grpbouton'+i).val(config["btgrt"+i]);
		$('#sgrpbouton'+i).val(config["btsgrt"+i]);
		$('#cadbouton'+i).append(listecadre);
		$('#cadbouton'+i).val(config["btcad"+i]);
	}
	
	displaybox('Sauvegarde restorée');
}

// Fonction de supression d'un backup
function deletebck()
{
	// Récupération du nom de la conf à supprimer
	if ( $('#supname').val() == "" )
	{
		displaybox('Erreur','Aucune sauvegarde n\'a été sélectionnée.');
    return false;
	}
	var configname = $('#supname').val();

	// supression de la config
	localStorage.removeItem(configname);

	// supression du catalogue des config
	var listecfg = JSON.parse(localStorage.getItem("backuptimetracking"));
	delete listecfg[configname];
	localStorage.setItem("backuptimetracking", JSON.stringify(listecfg));

	// Mise à jout des listes déroulantes
	resetselect();
	displaybox('Sauvegarde supprimée');
}

// Fonction d'export de la conf sous forme d'une chaine de caractère
// Cela permet de récupérer la conf sous forme de copier/coller
function exportbck()
{
	// Récupération du nom de la conf à exporter
	if ( $('#expname').val() == "" )
	{
		displaybox('Erreur','Aucune sauvegarde n\'a été sélectionnée.');
		return false;
	}
	var configname = $('#expname').val();

	// supression du catalogue des config
	var config = localStorage.getItem(configname);

	// Affichage de la configuration sous forme d'une chaine JSON dans le champ

	displaybox( 'Export Terminé',
							'Sélectionez tout le texte ci-dessous (avec CTRL+A ou Command+A) et copiez le:',
							'<code>' + config + '</code>');
}

// Fonction d'import de la conf sous forme d'une chaine de caractère
// Cela permet de récupérer la conf sous forme de copier/coller
function importbck()
{
	// Récupération de la conf à importer
	if ( $('#impname').val() == "" )
	{
		displaybox('Erreur','Le champs d\'import est vide.');
		return false;
	}
	var config = $('#impname').val();
  var configobj = JSON.parse(config);
	var configname = configobj["configname"];
	var listecfg = new Object();

	// Import de la configuration
	localStorage.setItem(configname, config);

	// Mise à jour de la liste des configs
	if (localStorage.getItem("backuptimetracking") === null) {
  	listecfg[configname] = configname;
  	localStorage.setItem("backuptimetracking", JSON.stringify(listecfg));
	}
	else
	{
		listecfg = JSON.parse(localStorage.getItem("backuptimetracking"));
		listecfg[configname] = configname;
		localStorage.setItem("backuptimetracking", JSON.stringify(listecfg));
	}

	$('#impname').val("");
	displaybox('Import Terminé','L\'import a été importé et sauvegardé sur cet ordinateur.', 'Vous y avez maintenant accès dans "<i>Restorer une configuration</i>"');
}

function setfocus(thisid)
{
	if (thisid == "settitlec")
	{
		$('#settitles, #settitleb').css({'background-color': '#AAA'});
		$('#settitlec').css({'background-color': '#FFF'});
		$('#boutonconfig, #cadreconfig, #sauvecharge').css('display', 'none');
		$('#cadreconfig').css('display', 'block');
	}
	else if (thisid == "settitleb")
	{
		$('#settitles, #settitlec').css({'background-color': '#AAA'});
		$('#'+thisid).css({'background-color': '#FFF'});
		$('#cadreconfig, #sauvecharge').css('display', 'none');
		$('#boutonconfig').css('display', 'block');
	}
	else if (thisid == "settitles")
	{
		$('#settitleb, #settitlec').css({'background-color': '#AAA'});
		$('#'+thisid).css({'background-color': '#FFF'});
		$('#cadreconfig, #boutonconfig').css('display', 'none');
		$('#sauvecharge').css('display', 'block');
	}
}

function displaybox(titre,texte1,texte2,texte3)
{
  // création de l'overlay
  var overlay = document.createElement("div");
	var overlayid = document.createAttribute("id");
	var overlayclass = document.createAttribute("class");
	overlayid.nodeValue = "dialogbox-overlay";
	overlayclass.nodeValue = "dialogbox-overlay";
	overlay.setAttributeNode(overlayid);
	overlay.setAttributeNode(overlayclass);
	document.getElementById("global").appendChild(overlay);

	// Création de la boite
	var box = document.createElement("div");
	var boxid = document.createAttribute("id");
	var boxclass = document.createAttribute("class");
	boxid.nodeValue = "dialogbox";
	boxclass.nodeValue = "dialogbox";
	box.setAttributeNode(boxid);
	box.setAttributeNode(boxclass);

	// insertion du titre
	box.innerHTML = "<h3>" + titre + "</h3>";
	
	// insertion du l'icone de fermeture
	box.innerHTML = box.innerHTML + "<div id='dialogbox-close' class='dialogbox-close'><img src='./img/x.png' alt='close' /></div>"
	
	if ( texte1 !== undefined )
	{
		box.innerHTML = box.innerHTML + "<p>" + texte1 + "</p>";
	}

	if ( texte2 !== undefined )
	{
		box.innerHTML = box.innerHTML + "<p>" + texte2 + "</p>";
	}

	if ( texte3 !== undefined )
	{
		box.innerHTML = box.innerHTML + "<p>" + texte3 + "</p>";
	}

	document.getElementById("global").appendChild(box);
	var margin = $('#dialogbox').width() / 2;
	$('#dialogbox').css('margin-left','-' + margin + 'px');
	dialogbox();
}

function onglet()
{
	//On Click Event
	$("ul.tabs li a").click(function() {
		var clicked = $(this);
		if ( ! $(clicked).hasClass("active") )
		{
			$("ul.tabs li a.active").removeClass("active"); //Remove any "active" class
			$(clicked).addClass("active"); //Add "active" class to selected tab

			//Hide all tab content
			$(".tab_content:visible").children().fadeOut(100, function() {
				$(this).parent().hide(0, function () {
					var activeTab = $(clicked).attr("href");
					$(activeTab).show(0, function () {
						$(this).children().fadeIn(100);
					});
				});
			});
		}
		return false;
	});
}

function dialogbox() {
	$('#dialogbox-overlay').show(0, function() {
		$('#dialogbox').show();
		$('#dialogbox-overlay, #dialogbox-close').click(function() {
			$('#dialogbox').remove();
			$('#dialogbox-overlay').remove();
		});
	});
}

function resetselect() {
	$('#backname, #supname, #expname').each(function() {
		$(this).children().each(function() {
			$(this).remove();
		});
		$(this).append('<option value="" disabled="disabled">Sélectionner...</option>');
		$(this).addClass('empty');
	});
}

