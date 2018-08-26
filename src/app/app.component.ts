/// <reference types="googlemaps" />
import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Renderer2,ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { chart } from 'highcharts';
import * as Highcharts from 'highcharts';
import * as Exporting from 'highcharts/modules/exporting';
Exporting(Highcharts);
import * as $ from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

@Injectable()
export class AppComponent implements OnInit{
  @ViewChild('gmap') gmapElement: any;
  @ViewChild('coddpto') coddpto: any;
  @ViewChild('codprov') codprov: any;
  @ViewChild('coddist') coddist: any;
  @ViewChild('codcenp') codcenp: any;
  @ViewChild('codserv') codserv: any;
  @ViewChild('codano') codano: any;
  isShow : boolean = true
  
  title = 'app';
  dpto: any;prov:any;dist:any;cenp:any;serv:any;groups: any;ano: any;
  map: google.maps.Map;
  infowindow: any;
  limites: any;
  markers = [];
  icons: any;
  cemchart: Highcharts.ChartObject;
  cemchartpie: Highcharts.ChartObject;
  femchart: Highcharts.ChartObject;
  datareporte: any;

  constructor(private http: HttpClient) {
    let iconBase = 'assets/images/';
    this.icons= {
      CEM: {
        icon: iconBase + 'caiwhit.png'
      },
      CAI: {
        icon: iconBase + 'femiwhit.png'
      },
      SAU: {
        icon: iconBase + 'sauwhit.png'
      },
      ER: {
        icon: iconBase + 'ruralwhit.png'
      }
    };
  }

  ngOnInit () {
    
  }

  ngAfterContentInit () {
    this.getDptos();
    
    let mapProp = {
      center: new google.maps.LatLng(-8.559, -73.655),
      zoom: 5,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    this.zoomLimitePolitico("00");
    this.coddpto=this.coddpto.nativeElement;
    this.codprov=this.codprov.nativeElement;
    this.coddist=this.coddist.nativeElement;
    this.codcenp=this.codcenp.nativeElement;
    this.codserv=this.codserv.nativeElement;
    this.codano=this.codano.nativeElement;
    this.datareporte={ 'data_rangos': [],'data_periodos': [] };
  }

  zoomLimitePolitico (ubigeo){
    //alert(ubigeo);
    if (this.limites){
      this.limites.setMap(null);
    }
    //alert(ruta);
    this.limites  = new google.maps.KmlLayer({
      url: 'http://170.239.101.25/kml/'+ubigeo+'.kml',
      preserveViewport: false
    });
    this.limites.setMap(this.map);
    //limites.setMap(null);
  }

  setMapType (mapTypeId: string) {
    this.map.setMapTypeId(mapTypeId)
  }

  getDptos () {
    this.http.get('http://170.239.101.25/BackPNCVFS/ubigeo_dpto.php').subscribe((data: any) => {
      this.dpto=data.dpto;
    });
  }
  getProv () {
    this.http.get('http://170.239.101.25/BackPNCVFS/ubigeo_prov.php?codigo='+this.coddpto.value).subscribe((data: any) => {
      this.codprov.value='00';
      this.coddist.value='00';
      this.codcenp.value='0000';
      this.prov=data.prov;
      this.dist=[];
      this.cenp=[];
      if(this.coddpto.value=='00'){
        this.zoomLimitePolitico('00');      
      }else{
        this.zoomLimitePolitico(this.coddpto.value);
      }
      this.getServicios();
    });
    
  }

  getDist () {
    this.http.get('http://170.239.101.25/BackPNCVFS/ubigeo_dist.php?codigo='+this.coddpto.value+this.codprov.value).subscribe((data: any) => {
      this.coddist.value='00';
      this.codcenp.value='0000';
      this.dist=data.dist;
      this.cenp=[];
      if(this.codprov.value=='00'){
        this.zoomLimitePolitico(this.coddpto.value);  
      }else{
        this.zoomLimitePolitico(this.coddpto.value+this.codprov.value);
      }
      this.getServicios();
    });
    
  }

  getCenP () {
    this.http.get('http://170.239.101.25/BackPNCVFS/ubigeo_cenp.php?codigo='+this.coddpto.value+this.codprov.value+this.coddist.value).subscribe((data: any) => {
      this.codcenp.value='0000';
      this.cenp=data.cenp;
      if(this.coddist.value=='00'){
        this.zoomLimitePolitico(this.coddpto.value+this.codprov.value);  
      }else{
        this.zoomLimitePolitico(this.coddpto.value+this.codprov.value+this.coddist.value);
      }
      this.getServicios();
    });
  }
  getServicios () {
    this.borrarMarcadores();
    this.desahabilitarSelects();
    this.http.get('http://170.239.101.25/BackPNCVFS/ubigeo_servicios.php?codigo='+this.coddpto.value+this.codprov.value+this.coddist.value+this.codcenp.value+'&anno'+this.codano.value).subscribe((data: any) => {
      this.serv=data.serv;
      this.datareporte=data.rep;
      this.codserv.value='00';
      this.habilitarSelects(); 
      this.redibujarMarcadores();
      let opts = '<option value="00">Servicio</option>';
      
      for(var key in Object.keys(this.groups)){
        opts = opts + '<option value="'+Object.keys(this.groups)[key]+'">'+this.groups[Object.keys(this.groups)[key]]+'</option>';
      }
      this.dibujarReportes();
      this.codserv.innerHTML=opts;

      let anos = '';
      if("CEM" in this.datareporte.data_rangos){
        for(let an in this.datareporte.data_periodos.CEM.EDAD){
          anos = anos + '<option value="'+an+'">'+an+'</option>';          
        }
      }else{
        anos = '<option value="00">Año</option>';
      }
      this.codano.innerHTML=anos;

      $("#contador").html(data.visitas);
    });
  }

  desahabilitarSelects(){
    this.coddpto.disabled = true;
    this.codprov.disabled = true;
    this.coddist.disabled = true;
    this.codcenp.disabled = true;
    this.codserv.disabled = true;
  }

  habilitarSelects(){
    this.coddpto.disabled = false;
    this.codprov.disabled = false;
    this.coddist.disabled = false;
    this.codcenp.disabled = false;
    this.codserv.disabled = false;
  }

  reemplazarSpan(){
    let texto='Peru';
    if(this.coddpto.value!='00')
      texto=this.coddpto.options[this.coddpto.selectedIndex].text;
    if(this.codprov.value!='00')
      texto=this.codprov.options[this.codprov.selectedIndex].text;
    if(this.coddist.value!='00')
      texto=this.coddist.options[this.coddist.selectedIndex].text;
    if(this.codcenp.value!='0000')
      texto=this.codcenp.options[this.codcenp.selectedIndex].text;

    $('.ubigeo').html(texto);
    
  }
  redibujarMarcadores () {
    this.borrarMarcadores();
    this.dibujarMarcadores();
    this.enfocarCentroPoblado();
  }

  borrarMarcadores () {
    for(let mar of this.markers){
      mar.setMap(null);
    }
    this.markers=[];
  }

  dibujarMarcadores () {
    
    this.groups={};

    for(let serv of this.serv){
      this.groups[serv.servicio]=serv.desserv;
      
      if(serv.servicio!=this.codserv.value && this.codserv.value!='00'){
        continue;
      }
      var image = {
        url: this.icons[serv.servicio].icon,
        scaledSize: new google.maps.Size(20+((serv.totalcasos)/1000), 20+((serv.totalcasos)/1000)), // scaled size
        origin: new google.maps.Point(0,0), // origin
        anchor: new google.maps.Point(0, 0)
      };

      let location = new google.maps.LatLng(serv.latitud, serv.longitud);
      let marker = new google.maps.Marker({
        position: location,
        map: this.map,
        icon: image
      });
      let contentString = '<div id="content">'+
      '<div id="siteNotice">'+
      '</div>'+
      '<h5 id="firstHeading" class="firstHeading">'+serv.descripcion+'</h5>'+
      '<div id="bodyContent">'+
      'Numero de casos atendidos: '+serv.totalcasos+
      '</div>'+
      '</div>';
      let infowindow = new google.maps.InfoWindow({
        content: contentString
      });    
      marker.addListener('click', function() {
        infowindow.open(this.map, marker);
      });
      this.markers.push(marker);
    }
  }

  enfocarCentroPoblado () {
    if(this.codcenp.value!='0000'){
      for(let cp of this.cenp){
        if(cp.codcenp==this.codcenp.value){
          let location = new google.maps.LatLng(cp.latitud,cp.longitud);
          let marker = new google.maps.Circle({
            strokeColor: '#5564eb',
            strokeOpacity: 0.5,
            fillColor: '#5564eb',
            fillOpacity: 0.35,
            radius: 5000,
            center: location,
            map: this.map
          });
          var center = new google.maps.Marker({
            map: this.map,
            position: location,
            title: cp.descripcion
          });
          this.markers.push(marker); 
          this.markers.push(center); 
          this.map.setCenter(location);
          this.map.setZoom(12);  
          break;
        }
      }
    }
  }
  dibujarReportes(){
    console.log(this.datareporte.data_periodos);
    this.reemplazarSpan();
    this.dibujarReportesCEM();
    this.dibujarReportesFEM();
  }

  dibujarReportesCEM(){
    if (document.getElementById('cemchart')){
      document.getElementById('cemchart').innerHTML='<div class="no-data">No se encontro informacion<div>';
      document.getElementById('cemchartpie').innerHTML='<div class="no-data">No se encontro informacion<div>';
    }
    if (("CEM" in this.datareporte.data_periodos) && document.getElementById('cemchart')){
      var options: Highcharts.Options = {
        chart: {
          type: 'column',
          inverted: false
        },
        title: {
          text: 'Grafica de Barra por edades y periodos'
        },
        xAxis: {
          title: {
            text: 'Periodo'
          },
          categories: Object.keys(this.datareporte.data_periodos['CEM']['EDAD'])
        },
        series: [{
          name: '1-17',
          data: Object.values(this.datareporte.data_rangos['CEM']['EDAD']['1-17']).map(Number)
        }, {
          name: '18-59',
          data: Object.values(this.datareporte.data_rangos['CEM']['EDAD']['18-59']).map(Number)
        }, {
          name: '60+',
          data: Object.values(this.datareporte.data_rangos['CEM']['EDAD']['60+']).map(Number)
        }]
      };    

      this.cemchart = chart(document.getElementById('cemchart'), options);

      var optionspie: Highcharts.Options = {
        chart: {
          type: 'pie'
        },
        title: {
          text: 'Grafica de Pie por edades'
        },
        tooltip: {
          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
          pie: {
            allowPointSelect: false,
            cursor: 'pointer',
            dataLabels: {
                enabled: true
            }
          }
        },
        series: [{
          name: 'Sexo',
          data: [{
              name: 'Masculino',
              y: this.datareporte.data_rangos['CEM']['SEXO'][1],
              sliced: true,
              selected: true
          },{
            name: 'Femenino',
            y: this.datareporte.data_rangos['CEM']['SEXO'][0]
          }]
        }],
        exporting: {
          enabled:true,
          filename: 'reporte-cem-sexo',
          type: 'application/pdf'
        }
      };    
      this.cemchartpie = chart(document.getElementById('cemchartpie'), optionspie);
    }
  }
  
  dibujarReportesFEM(){
    if(document.getElementById('femchart')){
      document.getElementById('femchart').innerHTML='<div class="no-data">No se encontro informacion<div>';
    }
    if (("FEM" in this.datareporte.data_periodos) && document.getElementById('femchart')){
      var options: Highcharts.Options = {
        chart: {
          type: 'column',
          inverted: false
        },
        title: {
          text: 'Grafica de Barra por edades y periodos'
        },
        xAxis: {
          title: {
            text: 'Periodo'
          },
          categories: Object.keys(this.datareporte.data_periodos['FEM']['EDAD'])
        },
        series: [{
          name: 'Grupo 1',
          data: Object.values(this.datareporte.data_rangos['FEM']['EDAD'][1]?this.datareporte.data_rangos['FEM']['EDAD'][1]:0).map(Number)
        }, {
          name: 'Grupo 2',
          data: Object.values(this.datareporte.data_rangos['FEM']['EDAD'][2]?this.datareporte.data_rangos['FEM']['EDAD'][2]:0).map(Number)
        },{
          name: 'Grupo 3',
          data: Object.values(this.datareporte.data_rangos['FEM']['EDAD'][3]?this.datareporte.data_rangos['FEM']['EDAD'][3]:0).map(Number)
        }, {
          name: 'Grupo 4',
          data: Object.values(this.datareporte.data_rangos['FEM']['EDAD'][4]?this.datareporte.data_rangos['FEM']['EDAD'][4]:0).map(Number)
        },{
          name: 'Grupo 5',
          data: Object.values(this.datareporte.data_rangos['FEM']['EDAD'][5]?this.datareporte.data_rangos['FEM']['EDAD'][5]:0).map(Number)
        },{
          name: 'Grupo 6',
          data: Object.values(this.datareporte.data_rangos['FEM']['EDAD'][6]?this.datareporte.data_rangos['FEM']['EDAD'][6]:0).map(Number)
        },{
          name: 'Grupo 7',
          data: Object.values(this.datareporte.data_rangos['FEM']['EDAD'][7]?this.datareporte.data_rangos['FEM']['EDAD'][7]:0).map(Number)
        },]
      };    
      this.femchart = chart(document.getElementById('femchart'), options);
    }
  }
}
