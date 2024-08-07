'use client'

import styles from '../../page.module.css'
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase-config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../firebase-config'
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, addDoc, query, where} from 'firebase/firestore'
import { generateGroupGames, deleteGroup } from '@/api/api';
import { setAdvancements } from '@/api/groupAPI';
//TODO: INTE ANPASSAD TILL NY DB
export default function Home() {
  const [loggedin, setLoggedin] = useState(false);
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [division, setDivision] = useState("0");
  const [groups, setGroups] = useState(null);
  const groupsCollectionRef = collection(db, "Groups");
  const [groupIndex, setGroupIndex] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDivision, setEditDivision] = useState("");
  const [started, setStarted] = useState(0);
  const [addTeamFlag, setAddTeamFlag] = useState(0);
  const [generateGamesFlag, setGenerateGamesFlag] = useState(0);
  const [finishGroupFlag, setFinishGroupFlag] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [teamDivision, setTeamDivision] = useState("0");
  const [successMessage, setSuccessMessage] = useState(0);
  const [errorMessage, setErrorMessage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [advFlag, setAdvFlag] = useState(0);
  const [adv1Id, setAdv1Id] = useState("");
  const [adv2Id, setAdv2Id] = useState("");
  const [adv3Id, setAdv3Id] = useState("");
  const [adv4Id, setAdv4Id] = useState("");
  const [adv5Id, setAdv5Id] = useState("");
  const [adv6Id, setAdv6Id] = useState("");
  const [adv1, setAdv1] = useState("");
  const [adv2, setAdv2] = useState("");
  const [adv3, setAdv3] = useState("");
  const [adv4, setAdv4] = useState("");
  const [adv5, setAdv5] = useState("");
  const [adv6, setAdv6] = useState("");
  const [adv1Pos, setAdv1Pos] = useState("1");
  const [adv2Pos, setAdv2Pos] = useState("1");
  const [adv3Pos, setAdv3Pos] = useState("1");
  const [adv4Pos, setAdv4Pos] = useState("1");
  const [adv5Pos, setAdv5Pos] = useState("1");
  const [adv6Pos, setAdv6Pos] = useState("1");

  const updateAdv = async () => {
    let advList = [];
    let advPosList = [];
    if(adv1 != ""){
      advList.push(adv1);
      advPosList.push(adv1Pos);
    }
    if(adv2 != ""){
      advList.push(adv2);
      advPosList.push(adv2Pos);
    }
    if(adv3 != ""){
      advList.push(adv3);
      advPosList.push(adv3Pos);
    }
    if(adv4 != ""){
      advList.push(adv4);
      advPosList.push(adv4Pos);
    }
    if(adv5 != ""){
      advList.push(adv5);
      advPosList.push(adv5Pos);
    }
    if(adv6 != ""){
      advList.push(adv6);
      advPosList.push(adv6Pos);
    }
    await setAdvancements(groups[groupIndex].id, advList, advPosList)
    setRefresh(refresh+1);
  }
//KLAR
  const generateGames = async () => {
    let teamIDAndNames = [];
    const q = query(collection(db, "GroupTeams"), where("GroupID", "==", groups[groupIndex].id));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      let groupTeam = doc.data();
      teamIDAndNames.push([groupTeam.TeamID, groupTeam.TeamData[0]]);
    });

    let res = await generateGroupGames(groups[groupIndex].id, groups[groupIndex].GroupName, teamIDAndNames, groups[groupIndex].GameIDs);
    setRefresh(refresh+1);
  }
  //EJ TESTAD KANSKE FIXAD
  const removeGroup = async () => {
    await deleteGroup(groups[groupIndex]);
    router.push("/groups");
  }

  //KLAR
  const addTeamToGroup = async () => {
    const teamsCollectionRef = collection(db, "Teams")
    //Find team in database
    
    const getTeams = async () => {
      let lst = [];
      const data = await getDocs(teamsCollectionRef);
      
      lst = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      return lst;
    }
    const checkIfTeamExists = (lst, teamName) => {
      for(let i in lst){
        
        if(teamName === lst[i].TeamName){
          return i;
        }
      }
      return -1;
    }

    let teamsList = await getTeams();
    
    let index = checkIfTeamExists(teamsList, teamName);
    if(index == -1){
      console.log("TEAM DOES NOT EXIST")
      return true;
    }else{
       //Generate team data
       let teamData = [teamName, "0", "0", "0", "0", "0", "0"];
       
       //Add to db
       const groupTeamsCollectionRef = collection(db, "GroupTeams");

       let group = 
      {
        TeamID: teamsList[index].id,
        GroupID: groups[groupIndex].id,
        TeamData: teamData,
        GroupName: groupName,
      }

      await addDoc(groupTeamsCollectionRef, group);
       
       setSuccessMessage(1);
       setErrorMessage(0); 
       setRefresh(refresh+1);
       return true;
    }
    setSuccessMessage(0);
    setErrorMessage(1);
    return false;
  }

  const toggleAddTeam = () =>{
    if (addTeamFlag === 0){
      setAddTeamFlag(1);
    }else{
      setAddTeamFlag(0);
    }
  }

  const toggleGenerateGames = () =>{
    if (generateGamesFlag === 0){
      setGenerateGamesFlag(1);
    }else{
      setGenerateGamesFlag(0);
    }
  }

  const toggleFinishGroup = async () =>{
    //Kolla så alla matcher är avslutade
    let group = groups[groupIndex];
    let gameIDs = group.GameIDs; 

    for(let i = 0; i < gameIDs.length; i++){
      //Hämta hem match
      let gameRef = doc(db, "Games", gameIDs[i]);
      let res = await getDoc(gameRef);
      let game = {...res.data(), id:res.id}

      //Kolla status
      if(game.Status != 2){
        console.log("Not all games are finished");
        return -1;
      }
    }

    //Skicka lag vidare till match/grupp
    //Matcha lagID till namn i teamData
    const q = query(collection(db, "GroupTeams"), where("GroupID", "==", groups[groupIndex].id));

    let posToTeamID = new Map();

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      posToTeamID.set(doc.data().TeamData[6], [doc.data().TeamID, doc.data().TeamData[0]]);
    });

    for(let i = 0; i < group.NextGames.length/2; i++){
      //Om det grupp
      if(group.NextGames[(i*2)+1] == "3"){
          
        //Lägg till lagID i grupp
          let advGroupID = group.NextGames[(i*2)];
          let groupRef = doc(db, "Groups", advGroupID);
          let res = await getDoc(groupRef);
          let advGroup = {...res.data(), id:res.id}
          let advTeamIDs = advGroup.TeamIDs;
          let advTeamData = advGroup.TeamData;
          advTeamIDs.push(teamIDToPos[i]);

          //Byt ut rätt placeholdernamn i grupp
          
          let placeholderName = group.GameName + (i+1).toString();
          for(let j = 0;  j < advTeamData.length/6; j++){
            if(placeholderName == advTeamData[j*6]){
              advTeamData[j*6] = group.TeamData[i*6];
            }
          }

          await updateDoc(groupRef, {
            TeamIDs: advTeamIDs,
            TeamData: advTeamData
          })
          let gIDs = [] 
          
          for(let j = 0; j < advGroup.Games.length; j++){
            let gameRef = doc(db, "Games", advGroup.Games[j]);
            let res2 = await getDoc(gameRef);
            let game = {...res2.data(), id:res2.id}
            
            if(game.Team1Name == placeholderName){
              //Byt ut placeholdernamn och id i match
              await updateDoc(gameRef, {
                Team1Name: group.TeamData[i*6],
                Team1ID: teamIDToPos[i]
              });
              //Lägg till matchID i lag
              gIDs.push(advGroup.Games[j]);

            }else if(game.Team2Name == placeholderName){
              //Byt ut placeholdernamn och id i match
              await updateDoc(gameRef, {
                Team2Name: group.TeamData[i*6],
                Team2ID: teamIDToPos[i]
              });
              //Lägg till matchID i lag
              gIDs.push(advGroup.Games[j]);
            }
          }
          let tRef = doc(db, "Teams", teamIDToPos[i]);
          let res3 = await getDoc(tRef);
          let t = {...res3.data(), id:res3.id}
          let gIDsOld = t.GameIDs;
          let gIDsNew = gIDsOld.concat(gIDs);
          let tgroupIDs = t.GroupID;
          tgroupIDs.push(advGroupID);
          
          await updateDoc(tRef, {
            gameIDs: gIDsNew,
            GroupID: tgroupIDs
          });

      }else{
        //Om det match
        let gameRef = doc(db, "Games", group.NextGames[i*2]);
        
        
        //Lägg till lagID och namn i match på rätt index
        if(group.NextGames[(i*2)+1] == 1){
          await updateDoc(gameRef, {
            Team1Name: posToTeamID.get((i+1).toString())[1],
          });
        }else if(group.NextGames[(i*2)+1] == 2){
          await updateDoc(gameRef, {
            Team2Name: posToTeamID.get((i+1).toString())[1],
          });
        }
        
        let teamGame = {
          GameID: group.NextGames[i*2],
          TeamID: posToTeamID.get((i+1).toString())[0],
          TeamPosition: group.NextGames[(i*2)+1],
        }
        const teamGameRef = collection(db, "TeamGame");
        await addDoc(teamGameRef, teamGame);
        
      }
    }
    

    

    if (finishGroupFlag === 0){
      setFinishGroupFlag(1);
    }else{
      setFinishGroupFlag(0);
    }
  }

  const toggleAdvancement = () => {
    if(advFlag === 0){
      setAdvFlag(1);
    }else{
      setAdvFlag(0);
    }
  }

  const updateTeamName = (event) => {
    setTeamName(event.target.value);
  }

  const updateGroupName = (event) => {
    setGroupName(event.target.value);
  }
  const updateEditName = (event) => {
    setEditName(event.target.value);
  }

  /*
  const deleteGroup = async () => {
    const groupRef = doc(db, "Group", groups[groupIndex].id);
    await deleteDoc(groupRef);
    router.push("/groups");
  }*/

  //KLAR
  const saveEdit = async () => {
    if(editName === ""){
      return null;
    }
    const groupRef = doc(db, "Groups", groups[groupIndex].id);
    await updateDoc(groupRef, {
      Name: editName
    });
    router.push("/groups")
  }

  const checkIfGroupExists = async () => {
    if(groups){
      for(let i in groups){
        if(groups[i].GroupName === groupName){
          setGroupIndex(i);
          setEditName(groups[i].GameName);
          
          for(let j in groups[i].NextGames){
            if(j == 0){
              setAdv1Id(groups[i].NextGames[j]);
              let gameRef = doc(db, "Games", groups[i].NextGames[j]);
              setAdv1Pos(groups[i].NextGames[parseInt(j)+1]);
              let res = await getDoc(gameRef);
              let game = { ...res.data(), id: res.id };
              
              setAdv1(game.GameName);
            }
            if(j == 2){
              setAdv2Id(groups[i].NextGames[j]);
              let gameRef = doc(db, "Games", groups[i].NextGames[j]);
              setAdv2Pos(groups[i].NextGames[parseInt(j)+1]);
              let res = await getDoc(gameRef);
              let game = { ...res.data(), id: res.id };
              setAdv2(game.GameName);
            }
            if(j == 4){
              setAdv3Id(groups[i].NextGames[j]);
              let gameRef = doc(db, "Games", groups[i].NextGames[j]);
              
              setAdv3Pos(groups[i].NextGames[parseInt(j)+1]);
              let res = await getDoc(gameRef);
              let game = { ...res.data(), id: res.id };
              setAdv3(game.GameName);
            }
            if(j == 6){
              setAdv4Id(groups[i].NextGames[j]);
              let gameRef = doc(db, "Games", groups[i].NextGames[j]);
              
              setAdv4Pos(groups[i].NextGames[parseInt(j)+1]);
              let res = await getDoc(gameRef);
              let game = { ...res.data(), id: res.id };
              setAdv4(game.GameName);
            }
            if(j == 8){
              setAdv5Id(groups[i].NextGames[j]);
              
              if(groups[i].NextGames[parseInt(j)+1] == 3){
                let groupRef = doc(db, "Groups", groups[i].NextGames[j]);
              
                setAdv5Pos(groups[i].NextGames[parseInt(j)+1]);
                let res = await getDoc(groupRef);
                let group = { ...res.data(), id: res.id };
                setAdv5(group.GameName);
              }else{
                let gameRef = doc(db, "Games", groups[i].NextGames[j]);
              
                setAdv5Pos(groups[i].NextGames[parseInt(j)+1]);
                let res = await getDoc(gameRef);
                let game = { ...res.data(), id: res.id };
                setAdv5(game.GameName);
              }
            }
            if(j == 10){
              setAdv6Id(groups[i].NextGames[j]);
              
              if(groups[i].NextGames[parseInt(j)+1] == 3){
                let groupRef = doc(db, "Groups", groups[i].NextGames[j]);
              
                setAdv6Pos(groups[i].NextGames[parseInt(j)+1]);
                let res = await getDoc(groupRef);
                let group = { ...res.data(), id: res.id };
                setAdv6(group.GameName);
              }else{
                let gameRef = doc(db, "Games", groups[i].NextGames[j]);
              
                setAdv6Pos(groups[i].NextGames[parseInt(j)+1]);
                let res = await getDoc(gameRef);
                let game = { ...res.data(), id: res.id };
                setAdv6(game.GameName);
              }
            }
          }
          //TODO: FIXA????
          /*
          if(groups[i].Games.length === 0){
            setStarted(0);
          }else{
            setStarted(1);
          }
            */
          return true;
        }
      }
      setGroupIndex(null);
      return false;
    }
    return null;
  }

  useEffect(() => {
    const getGroups = async () => {
      const data = await getDocs(groupsCollectionRef);
      setGroups(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    }
    
    getGroups();
  }, [refresh])
  
  useEffect(()=>{
      onAuthStateChanged(auth, (user) => {
          if (user) {
            const uid = user.uid;
            setLoggedin(true)
          } else {
            setLoggedin(false);
            router.push('/');
          }
        });
        
  }, [])

  return (
      <main className={styles.main}>
        { loggedin && groups &&
          <div className={styles.centerVert}>
            <h2>Create Group</h2>
            <div className={styles.center}>
              <Link href={"/groups"}>
                <div className={styles.enterButton}>Go back</div>
              </Link>
            </div>
            <div className={styles.center2}> 
              <h3>Group name: </h3>
              <input value={groupName} onChange={updateGroupName} className={styles.input} placeholder='Enter group name'></input>
            </div>
            
            <div className={styles.center} style={{borderBottom: "solid"}}>
              <div className={styles.createButton} onClick={checkIfGroupExists}>Edit group</div>
            </div>
            
            { groupIndex &&
              <>
                <div className={styles.center2}>
                  <h3>Edit name: </h3>
                  <input value={editName} onChange={updateEditName} className={styles.input} placeholder='Enter new group name'></input>
                </div>
                
                <div className={styles.center}>
                  <div className={styles.deleteButton} onClick={removeGroup}>Delete group</div>
                </div>
                <div className={styles.center} style={{borderBottom: "solid"}}>
                  <div className={styles.createButton} onClick={saveEdit}>Save</div>
                </div>
                <div className={styles.center3} style={{borderBottom: "solid"}}>
                  <div className={styles.createButton} onClick={toggleAdvancement}>Set advancement</div>
                  { advFlag === 1 &&
                  <div>
                    <div className={styles.center}>
                      <h4>Team 1</h4>
                      <input value={adv1} onChange={e => setAdv1(e.target.value)} className={styles.input} placeholder='1st placement adv'></input>
                      <select
                          value={adv1Pos}
                          onChange={e => setAdv1Pos(e.target.value)}
                          className={styles.select}
                        >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                      <div className={styles.center}>
                      <h4>Team 2</h4>
                      <input value={adv2} onChange={e => setAdv2(e.target.value)} className={styles.input} placeholder='2nd placement adv'></input>
                      <select
                          value={adv2Pos}
                          onChange={e => setAdv2Pos(e.target.value)}
                          className={styles.select}
                        >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                      <div className={styles.center}>
                      <h4>Team 3</h4>
                      <input value={adv3} onChange={e => setAdv3(e.target.value)} className={styles.input} placeholder='3rd placement adv'></input>
                      <select
                          value={adv3Pos}
                          onChange={e => setAdv3Pos(e.target.value)}
                          className={styles.select}
                        >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                    <div className={styles.center}>
                      <h4>Team 4</h4>
                      <input value={adv4} onChange={e => setAdv4(e.target.value)} className={styles.input} placeholder='4th placement adv'></input>
                      <select
                          value={adv4Pos}
                          onChange={e => setAdv4Pos(e.target.value)}
                          className={styles.select}
                        >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>

                    <div className={styles.center}>
                      <h4>Team 5</h4>
                      <input value={adv5} onChange={e => setAdv5(e.target.value)} className={styles.input} placeholder='5th placement adv'></input>
                      <select
                          value={adv5Pos}
                          onChange={e => setAdv5Pos(e.target.value)}
                          className={styles.select}
                        >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">Group</option>
                      </select>
                    </div>

                    <div className={styles.center}>
                      <h4>Team 6</h4>
                      <input value={adv6} onChange={e => setAdv6(e.target.value)} className={styles.input} placeholder='6th placement adv'></input>
                      <select
                          value={adv6Pos}
                          onChange={e => setAdv6Pos(e.target.value)}
                          className={styles.select}
                        >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">Group</option>
                      </select>
                    </div>
                    <div className={styles.enterButton} onClick={updateAdv}>Enter advancements</div>

                    </div>
                  }
                </div>
                <div className={styles.center3}>
                  <div className={styles.createButton} onClick={toggleAddTeam}>Add team</div>
                  { addTeamFlag === 1 && started === 0 &&
                  <>
                    <div className={styles.center2}> 
                      <h3>Team name: </h3>
                      <input value={teamName} onChange={updateTeamName} className={styles.input} placeholder='Enter team name'></input>
                    </div>
                    
                    <div className={styles.enterButton} onClick={addTeamToGroup}>Add to group</div>
                    { successMessage === 1 &&
                      <h3>Success!</h3>
                    }
                    { errorMessage === 1 &&
                      <h3>Error!</h3>
                    }
                  </>
                  }
                </div>
                { started === 0 &&
                <>
                  <div className={styles.center}>
                    <div className={styles.createButton} onClick={toggleGenerateGames} >Generate games</div>
                  </div>
                    { generateGamesFlag === 1 &&
                      <div className={styles.center2} style={{borderBottom: "solid"}}>
                        <div className={styles.enterButton} onClick={generateGames}>Are you sure?</div>
                      </div>
                    }
                  
                </>
                }
                <div className={styles.center}>
                    <div className={styles.createButton} onClick={toggleFinishGroup}>Finish group</div>
                </div>
              </>
            }
          </div>
        }
      </main>
)
}